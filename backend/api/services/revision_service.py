"""
Service de révision intelligente (Algorithme d'Adaptation).

Logique :
  - Analyser les performances d'un élève
  - Identifier les notions échouées (via Performance.notions_a_reviser et taux d'erreur)
  - Proposer des exercices plus simples sur ces notions
  - Générer un feedback IA personnalisé
  - Calculer un « profil de maîtrise » par notion
"""

from django.db.models import Count, Q, Avg, F
from ..models import Performance, Notion, Exercice, Lecon


# ── Mapping de descente de difficulté ──
DESCENTE_DIFFICULTE = {
    'difficile': 'moyen',
    'moyen': 'facile',
    'facile': 'facile',  # déjà au minimum
}


def analyser_maitrise_eleve(eleve):
    """
    Analyse toutes les performances d'un élève et retourne un profil
    de maîtrise par notion.

    Retourne une liste triée (pires notions en premier) :
    [
        {
            'notion_id': 4,
            'notion_titre': 'Les Fractions',
            'lecon_titre': 'Maths 6e',
            'total_tentatives': 5,
            'reussites': 1,
            'echecs': 4,
            'taux_reussite': 20.0,
            'score_moyen': 25.0,
            'niveau_maitrise': 'faible',     # faible / moyen / bon / excellent
            'difficulte_recommandee': 'facile',
        },
        ...
    ]
    """
    # Récupérer toutes les notions tentées par l'élève via les exercices
    perfs = Performance.objects.filter(eleve=eleve).select_related(
        'exercice__notion', 'exercice__lecon',
    )

    # Regrouper par notion
    stats_par_notion = {}
    for perf in perfs:
        notion = perf.exercice.notion
        if not notion:
            continue

        nid = notion.id
        if nid not in stats_par_notion:
            stats_par_notion[nid] = {
                'notion_id': nid,
                'notion_titre': notion.titre,
                'lecon_id': perf.exercice.lecon_id,
                'lecon_titre': perf.exercice.lecon.titre,
                'total_tentatives': 0,
                'reussites': 0,
                'echecs': 0,
                'scores': [],
                'derniere_difficulte': perf.exercice.difficulte,
            }

        entry = stats_par_notion[nid]
        entry['total_tentatives'] += 1
        if perf.est_correcte:
            entry['reussites'] += 1
        else:
            entry['echecs'] += 1
        entry['scores'].append(perf.score)
        entry['derniere_difficulte'] = perf.exercice.difficulte

    # Calculer les métriques et le niveau de maîtrise
    resultats = []
    for nid, entry in stats_par_notion.items():
        total = entry['total_tentatives']
        taux = round((entry['reussites'] / total * 100), 1) if total > 0 else 0
        score_moyen = round(sum(entry['scores']) / len(entry['scores']), 1) if entry['scores'] else 0

        # Déterminer le niveau de maîtrise
        if taux >= 90:
            niveau = 'excellent'
        elif taux >= 70:
            niveau = 'bon'
        elif taux >= 40:
            niveau = 'moyen'
        else:
            niveau = 'faible'

        # Recommander la difficulté adaptée
        if niveau in ('faible', 'moyen'):
            diff_recommandee = DESCENTE_DIFFICULTE.get(
                entry['derniere_difficulte'], 'facile'
            )
        elif niveau == 'bon':
            diff_recommandee = entry['derniere_difficulte']
        else:
            # excellent → proposer plus dur
            diff_recommandee = 'difficile'

        resultats.append({
            'notion_id': nid,
            'notion_titre': entry['notion_titre'],
            'lecon_id': entry['lecon_id'],
            'lecon_titre': entry['lecon_titre'],
            'total_tentatives': total,
            'reussites': entry['reussites'],
            'echecs': entry['echecs'],
            'taux_reussite': taux,
            'score_moyen': score_moyen,
            'niveau_maitrise': niveau,
            'difficulte_recommandee': diff_recommandee,
        })

    # Trier : pires notions en premier
    resultats.sort(key=lambda x: x['taux_reussite'])
    return resultats


def obtenir_notions_faibles(eleve, seuil_taux=60, limit=10):
    """
    Retourne les notions sous le seuil de maîtrise (taux < seuil_taux).
    """
    maitrise = analyser_maitrise_eleve(eleve)
    return [n for n in maitrise if n['taux_reussite'] < seuil_taux][:limit]


def proposer_exercices_adaptatifs(eleve, limit=10):
    """
    Propose des exercices adaptés au niveau de l'élève.

    Logique :
      1. Identifier les notions faibles (taux < 60%)
      2. Pour chaque notion faible, chercher des exercices à difficulté inférieure
      3. Exclure les exercices déjà réussis
      4. Retourner les exercices recommandés, triés par pertinence
    """
    notions_faibles = obtenir_notions_faibles(eleve, seuil_taux=60)

    if not notions_faibles:
        # L'élève est bon partout → proposer des exercices plus durs
        return _proposer_exercices_challenge(eleve, limit)

    # IDs des exercices déjà réussis
    exercices_reussis = set(
        Performance.objects.filter(eleve=eleve, est_correcte=True)
        .values_list('exercice_id', flat=True)
    )

    recommandations = []
    for nf in notions_faibles:
        diff_cible = nf['difficulte_recommandee']
        notion_id = nf['notion_id']

        # Chercher des exercices sur cette notion à la difficulté recommandée
        exercices = Exercice.objects.filter(
            notion_id=notion_id,
            difficulte=diff_cible,
        ).exclude(id__in=exercices_reussis)

        # Si pas assez, élargir à la leçon
        if exercices.count() == 0:
            exercices = Exercice.objects.filter(
                lecon_id=nf['lecon_id'],
                difficulte=diff_cible,
            ).exclude(id__in=exercices_reussis)

        # Si toujours rien, prendre n'importe quel exercice non réussi de la leçon
        if exercices.count() == 0:
            exercices = Exercice.objects.filter(
                lecon_id=nf['lecon_id'],
            ).exclude(id__in=exercices_reussis)

        for ex in exercices[:3]:
            recommandations.append({
                'exercice': ex,
                'raison': f"Notion « {nf['notion_titre']} » à renforcer "
                          f"(taux: {nf['taux_reussite']}%)",
                'notion_faible': nf,
            })

    # Dédupliquer
    seen = set()
    unique = []
    for r in recommandations:
        if r['exercice'].id not in seen:
            seen.add(r['exercice'].id)
            unique.append(r)

    return unique[:limit]


def _proposer_exercices_challenge(eleve, limit=10):
    """
    Pour un élève qui maîtrise tout : proposer des exercices plus difficiles
    ou des exercices non encore tentés.
    """
    exercices_tentes = set(
        Performance.objects.filter(eleve=eleve)
        .values_list('exercice_id', flat=True)
    )

    # Exercices jamais tentés, en commençant par les plus difficiles
    exercices = (
        Exercice.objects
        .exclude(id__in=exercices_tentes)
        .order_by('-difficulte')[:limit]
    )

    return [
        {
            'exercice': ex,
            'raison': 'Exercice non encore tenté — défi !',
            'notion_faible': None,
        }
        for ex in exercices
    ]


def generer_feedback_revision(eleve):
    """
    Génère un feedback textuel personnalisé pour l'élève basé sur
    son profil de maîtrise.
    """
    maitrise = analyser_maitrise_eleve(eleve)

    if not maitrise:
        return {
            'message': "Tu n'as pas encore passé d'exercices. "
                       "Commence par lire une leçon et tenter le quiz !",
            'conseil': 'decouvrir',
            'notions_faibles': [],
            'notions_fortes': [],
        }

    faibles = [n for n in maitrise if n['niveau_maitrise'] in ('faible', 'moyen')]
    fortes = [n for n in maitrise if n['niveau_maitrise'] in ('bon', 'excellent')]

    # Score global
    total_tentatives = sum(n['total_tentatives'] for n in maitrise)
    total_reussites = sum(n['reussites'] for n in maitrise)
    taux_global = round((total_reussites / total_tentatives * 100), 1) if total_tentatives > 0 else 0

    if taux_global >= 80:
        msg = (
            f"Excellent travail ! Tu as un taux de réussite global de {taux_global}%. "
            f"Tu maîtrises bien {len(fortes)} notion(s)."
        )
        if faibles:
            msg += f" Il te reste {len(faibles)} notion(s) à perfectionner."
        conseil = 'challenge'
    elif taux_global >= 50:
        msg = (
            f"Bon progrès ! Ton taux de réussite est de {taux_global}%. "
            f"Concentre-toi sur les {len(faibles)} notion(s) à réviser "
            f"pour t'améliorer encore."
        )
        conseil = 'reviser'
    else:
        msg = (
            f"Continue tes efforts ! Ton taux est de {taux_global}%. "
            f"Pas d'inquiétude, la révision ciblée va t'aider à progresser. "
            f"Commence par les exercices faciles sur les notions signalées."
        )
        conseil = 'renforcer'

    return {
        'message': msg,
        'conseil': conseil,
        'taux_global': taux_global,
        'total_tentatives': total_tentatives,
        'notions_faibles': faibles[:5],
        'notions_fortes': fortes[:5],
    }
