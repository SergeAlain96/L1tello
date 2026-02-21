"""
Service de découpage du texte d'une leçon en "notions".
Chaque notion est un fragment thématique autonome utilisé
par le tuteur intelligent pour cibler les révisions.

Stratégie de découpage :
  1. Chercher les titres / sous-titres (numérotés ou marqués).
  2. À défaut, découper par paragraphes significatifs.
  3. Chaque bloc devient une Notion liée à la Leçon.
"""

import re
import logging

logger = logging.getLogger(__name__)

# ── Patterns de titres courants dans les cours scolaires ──
TITRE_PATTERNS = [
    # I. / II. / III. / IV. …
    r'^(?P<titre>[IVXLCDM]+[\.\)]\s*.+)$',
    # 1. / 2. / 3. …
    r'^(?P<titre>\d+[\.\)]\s*.+)$',
    # A) / B) / a) / b) …
    r'^(?P<titre>[A-Za-z][\.\)]\s*.+)$',
    # Chapitre X : … / Partie X : …
    r'^(?P<titre>(?:Chapitre|Partie|Section|Leçon)\s*\d*\s*[:\-–].+)$',
    # Lignes EN MAJUSCULES (titres typiques dans les PDF scolaires)
    r'^(?P<titre>[A-ZÀÂÉÈÊËÎÏÔÙÛÜÇ\s]{8,})$',
]

MIN_CONTENU_LENGTH = 50   # Ignorer les blocs trop courts


def decouper_en_notions(texte: str) -> list[dict]:
    """
    Découpe un texte de leçon en notions structurées.

    Args:
        texte: Le texte brut extrait du PDF.

    Returns:
        Liste de dicts : [{"titre": "…", "contenu": "…", "ordre": 1}, …]
    """
    if not texte or len(texte.strip()) < MIN_CONTENU_LENGTH:
        logger.warning("Texte trop court pour être découpé en notions.")
        return []

    # ── Étape 1 : Tenter le découpage par titres détectés ──
    sections = _decouper_par_titres(texte)

    # ── Étape 2 : Fallback par paragraphes si pas de titres ──
    if len(sections) <= 1:
        sections = _decouper_par_paragraphes(texte)

    # ── Étape 3 : Numéroter et filtrer ──
    notions = []
    for i, section in enumerate(sections, start=1):
        titre = section.get('titre', '').strip()
        contenu = section.get('contenu', '').strip()

        if len(contenu) < MIN_CONTENU_LENGTH:
            continue

        if not titre:
            titre = f"Notion {i}"

        notions.append({
            'titre': titre,
            'contenu': contenu,
            'ordre': i,
        })

    logger.info(f"Texte découpé en {len(notions)} notion(s).")
    return notions


def _decouper_par_titres(texte: str) -> list[dict]:
    """Découpe le texte en se basant sur les titres détectés."""
    lignes = texte.splitlines()
    sections = []
    section_courante = {'titre': '', 'contenu': ''}

    for ligne in lignes:
        ligne_stripped = ligne.strip()
        if not ligne_stripped:
            section_courante['contenu'] += '\n'
            continue

        est_titre = False
        for pattern in TITRE_PATTERNS:
            match = re.match(pattern, ligne_stripped, re.IGNORECASE)
            if match:
                # Sauvegarder la section précédente
                if section_courante['contenu'].strip():
                    sections.append(section_courante)
                section_courante = {
                    'titre': match.group('titre').strip(),
                    'contenu': '',
                }
                est_titre = True
                break

        if not est_titre:
            section_courante['contenu'] += ligne_stripped + '\n'

    # Dernière section
    if section_courante['contenu'].strip():
        sections.append(section_courante)

    return sections


def _decouper_par_paragraphes(texte: str) -> list[dict]:
    """
    Fallback : découpe le texte en blocs de paragraphes
    quand aucun titre n'est détecté.
    """
    # Séparer par double saut de ligne
    blocs = re.split(r'\n{2,}', texte)

    sections = []
    for bloc in blocs:
        bloc = bloc.strip()
        if len(bloc) < MIN_CONTENU_LENGTH:
            continue

        # Utiliser la première ligne comme titre approximatif
        premiere_ligne = bloc.splitlines()[0][:80]
        contenu = bloc

        sections.append({
            'titre': premiere_ligne,
            'contenu': contenu,
        })

    return sections
