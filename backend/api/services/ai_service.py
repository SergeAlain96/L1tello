"""
Service IA pour L1tello — Utilise LangChain + Google Gemini (RAG).

Fonctionnalités :
  - Génération de quiz QCM à partir du texte d'une leçon (RAG)
  - Chatbot tuteur contextuel (répond aux questions sur la leçon)
"""

import json
import logging
import re
import time

from django.conf import settings

logger = logging.getLogger(__name__)

# Modèles à essayer dans l'ordre (fallback automatique si quota épuisé)
FALLBACK_MODELS = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.5-flash',
]

MAX_RETRIES = 2
RETRY_DELAY = 3  # secondes


def _get_llm(model_name: str | None = None):
    """Retourne une instance du LLM configuré (Google Gemini via LangChain)."""
    model = model_name or getattr(settings, 'GEMINI_MODEL', 'gemini-2.0-flash-lite')
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model=model,
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.7,
        )
    except ImportError:
        logger.warning("langchain-google-genai non installé. Tentative avec langchain-core.")
        from langchain.chat_models import init_chat_model
        return init_chat_model(
            model=model,
            model_provider="google_genai",
            api_key=settings.GEMINI_API_KEY,
            temperature=0.7,
        )


def _invoke_with_fallback(prompt: str) -> str:
    """
    Appelle le LLM avec retry et fallback automatique entre modèles.
    Si un modèle retourne 429 (quota épuisé), on passe au suivant.
    """
    primary = getattr(settings, 'GEMINI_MODEL', 'gemini-2.0-flash-lite')
    models_to_try = [primary] + [m for m in FALLBACK_MODELS if m != primary]

    last_error = None
    for model_name in models_to_try:
        for attempt in range(MAX_RETRIES):
            try:
                llm = _get_llm(model_name)
                response = llm.invoke(prompt)
                content = response.content if hasattr(response, 'content') else str(response)
                logger.info(f"IA OK avec modèle {model_name} (tentative {attempt + 1})")
                return content
            except Exception as e:
                last_error = e
                err_str = str(e).lower()
                is_quota = '429' in err_str or 'resource_exhausted' in err_str or 'quota' in err_str
                if is_quota:
                    logger.warning(f"Quota épuisé pour {model_name} (tentative {attempt + 1}). Fallback…")
                    break  # Passer au modèle suivant immédiatement
                else:
                    # Erreur temporaire → retry avec délai
                    logger.warning(f"Erreur {model_name} (tentative {attempt + 1}/{MAX_RETRIES}): {e}")
                    if attempt < MAX_RETRIES - 1:
                        time.sleep(RETRY_DELAY * (attempt + 1))

    raise ValueError(f"Tous les modèles IA sont indisponibles. Dernière erreur : {last_error}")


def _extract_json_from_response(text: str) -> list | dict | None:
    """Extrait du JSON depuis une réponse LLM (gère les blocs ```json```)."""
    # Tenter d'abord le bloc ```json ... ```
    match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', text, re.DOTALL)
    if match:
        text = match.group(1).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Tenter de trouver un tableau JSON dans le texte
        match = re.search(r'\[.*\]', text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass

        logger.error(f"Impossible de parser le JSON de l'IA : {text[:200]}")
        return None


# ════════════════════════════════════════════════════════════
# 1. GÉNÉRATION DE QUIZ (RAG)
# ════════════════════════════════════════════════════════════

def generer_quiz_ia(texte_lecon: str, niveau: str = "6e", nb_questions: int = 5) -> list[dict]:
    """
    Génère un quiz QCM à partir du texte d'une leçon via l'IA.

    Args:
        texte_lecon: Le texte extrait du PDF de la leçon.
        niveau: Le niveau scolaire (CP, CE1, ..., Terminale).
        nb_questions: Nombre de questions à générer.

    Returns:
        Liste de dicts au format :
        [
            {
                "question": "...",
                "choix": [
                    {"texte": "...", "correct": true},
                    {"texte": "...", "correct": false},
                    ...
                ],
                "explication": "...",
                "difficulte": "facile|moyen|difficile"
            },
            ...
        ]
    """
    if not texte_lecon or len(texte_lecon.strip()) < 50:
        logger.warning("Texte trop court pour générer un quiz IA.")
        return []

    # Tronquer le texte si trop long (limite de contexte)
    max_chars = 8000
    texte_tronque = texte_lecon[:max_chars] if len(texte_lecon) > max_chars else texte_lecon

    prompt = f"""Tu es un enseignant expert qui crée des exercices pour des élèves de niveau {niveau}.

À partir du texte de leçon suivant, crée exactement {nb_questions} questions QCM (Questions à Choix Multiples).

RÈGLES STRICTES :
1. Chaque question doit avoir exactement 4 choix de réponse.
2. Un seul choix doit être correct (marqué "correct": true).
3. Les questions doivent être adaptées au niveau {niveau}.
4. Inclus une explication pédagogique pour chaque question.
5. Varie la difficulté : mélange facile, moyen et difficile.
6. Les questions doivent porter directement sur le contenu du texte.

TEXTE DE LA LEÇON :
---
{texte_tronque}
---

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte autour. Format exact :
[
  {{
    "question": "La question ici ?",
    "choix": [
      {{"texte": "Réponse A", "correct": false}},
      {{"texte": "Réponse B", "correct": true}},
      {{"texte": "Réponse C", "correct": false}},
      {{"texte": "Réponse D", "correct": false}}
    ],
    "explication": "Explication pédagogique ici.",
    "difficulte": "moyen"
  }}
]"""

    try:
        content = _invoke_with_fallback(prompt)

        questions = _extract_json_from_response(content)
        if not questions or not isinstance(questions, list):
            logger.error("L'IA n'a pas retourné un tableau JSON valide.")
            return []

        # Valider et nettoyer chaque question
        questions_valides = []
        for q in questions:
            if not isinstance(q, dict):
                continue
            if 'question' not in q or 'choix' not in q:
                continue
            if not isinstance(q['choix'], list) or len(q['choix']) < 2:
                continue

            # S'assurer qu'il y a exactement un choix correct
            nb_correct = sum(1 for c in q['choix'] if c.get('correct'))
            if nb_correct != 1:
                # Corriger : marquer le premier comme correct
                for c in q['choix']:
                    c['correct'] = False
                q['choix'][0]['correct'] = True

            questions_valides.append({
                'question': q['question'],
                'choix': q['choix'],
                'explication': q.get('explication', ''),
                'difficulte': q.get('difficulte', 'moyen'),
            })

        logger.info(f"Quiz IA généré : {len(questions_valides)} questions valides.")
        return questions_valides

    except Exception as e:
        logger.error(f"Erreur lors de la génération du quiz IA : {e}")
        raise ValueError(f"Erreur IA : {e}")


# ════════════════════════════════════════════════════════════
# 2. CHATBOT TUTEUR (RAG)
# ════════════════════════════════════════════════════════════

def chatbot_tuteur(
    texte_lecon: str,
    question_eleve: str,
    historique: list[dict] | None = None,
    niveau: str = "6e",
) -> str:
    """
    Chatbot tuteur contextuel qui répond aux questions de l'élève
    en se basant sur le texte de la leçon (RAG).

    Args:
        texte_lecon: Le texte extrait du PDF.
        question_eleve: La question posée par l'élève.
        historique: Liste de messages précédents [{"role": "user"|"assistant", "content": "..."}].
        niveau: Niveau scolaire de l'élève.

    Returns:
        La réponse du tuteur IA.
    """
    if not question_eleve or not question_eleve.strip():
        return "Pose-moi une question et je t'aiderai ! 🎓"

    # Tronquer le texte source
    max_chars = 6000
    texte_tronque = texte_lecon[:max_chars] if len(texte_lecon) > max_chars else texte_lecon

    # Construire le contexte de conversation
    historique_texte = ""
    if historique:
        # Garder les 10 derniers échanges
        for msg in historique[-10:]:
            role = "Élève" if msg.get('role') == 'user' else "Tuteur"
            historique_texte += f"{role} : {msg.get('content', '')}\n"

    prompt = f"""Tu es un tuteur pédagogique bienveillant et patient pour un élève de niveau {niveau}.
Tu dois répondre UNIQUEMENT en te basant sur le contenu de la leçon ci-dessous.
Si la question ne concerne pas la leçon, redirige poliment l'élève vers le sujet.

RÈGLES :
1. Réponds de manière claire et adaptée au niveau {niveau}.
2. Utilise des exemples concrets et des analogies simples.
3. Encourage l'élève et reste positif.
4. Si tu ne trouves pas la réponse dans le texte, dis-le honnêtement.
5. Utilise des emojis pour rendre la conversation agréable.
6. Sois concis mais complet.

TEXTE DE LA LEÇON :
---
{texte_tronque}
---

{f"HISTORIQUE DE CONVERSATION :{chr(10)}{historique_texte}" if historique_texte else ""}

QUESTION DE L'ÉLÈVE : {question_eleve}

RÉPONSE DU TUTEUR :"""

    try:
        content = _invoke_with_fallback(prompt)
        return content.strip()

    except Exception as e:
        logger.error(f"Erreur chatbot IA : {e}")
        return (
            "Désolé, je rencontre un problème technique. 😓 "
            "Réessaie dans quelques instants ou relis la notion dans le panneau de gauche."
        )
