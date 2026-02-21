from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Count, Avg, Q

from .models import Utilisateur, Matiere, Lecon, Notion, Exercice, Performance
from .serializers import (
    UtilisateurSerializer,
    InscriptionSerializer,
    MatiereSerializer,
    LeconListSerializer,
    LeconDetailSerializer,
    LeconUploadSerializer,
    NotionSerializer,
    ExerciceSerializer,
    PerformanceSerializer,
)
from .services.pdf_service import extraire_texte_pdf
from .services.notion_service import decouper_en_notions
from .services.revision_service import (
    analyser_maitrise_eleve,
    proposer_exercices_adaptatifs,
    generer_feedback_revision,
)
from .services.ai_service import generer_quiz_ia, chatbot_tuteur
from .permissions import IsTutorOrAdmin, IsTutorOrReadOnly, CanUploadLecon
from .validators import validate_pdf_file, sanitize_text, sanitize_dict


# ════════════════════════════════════════════════════════════
# Endpoint de test
# ════════════════════════════════════════════════════════════

@api_view(['GET'])
def hello_world(request):
    """Endpoint de test : vérifie que le Backend fonctionne."""
    return Response({
        'message': 'Bienvenue sur L1tello ! 🎓',
        'status': 'Le backend Django fonctionne correctement.',
    })


# ════════════════════════════════════════════════════════════
# Auth : Inscription + Profil
# ════════════════════════════════════════════════════════════

@api_view(['POST'])
def inscription(request):
    """Créer un nouveau compte et retourner les tokens JWT."""
    serializer = InscriptionSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UtilisateurSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            },
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profil(request):
    """Voir ou modifier son profil."""
    if request.method == 'GET':
        return Response(UtilisateurSerializer(request.user).data)

    serializer = UtilisateurSerializer(
        request.user, data=request.data, partial=True,
    )
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ════════════════════════════════════════════════════════════
# Dashboard : Statistiques de progression
# ════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    """Retourne les statistiques selon le rôle : élève ou tuteur."""
    user = request.user

    if user.role == 'tuteur':
        # ── Dashboard Tuteur : ses leçons + suivi de ses élèves ──
        lecons = Lecon.objects.filter(auteur=user).order_by('-created_at')[:10]

        # Élèves ayant fait des exercices sur les leçons du tuteur
        perfs_eleves = Performance.objects.filter(
            exercice__lecon__auteur=user
        ).select_related('eleve', 'exercice')

        total_eleves = perfs_eleves.values('eleve').distinct().count()
        total_perfs = perfs_eleves.count()
        taux_global = 0
        if total_perfs > 0:
            ok = perfs_eleves.filter(est_correcte=True).count()
            taux_global = round((ok / total_perfs * 100), 1)

        # Top élèves
        top_eleves = (
            perfs_eleves
            .values('eleve__id', 'eleve__username', 'eleve__first_name')
            .annotate(
                nb_tentatives=Count('id'),
                score_moyen=Avg('score'),
            )
            .order_by('-score_moyen')[:5]
        )

        return Response({
            'utilisateur': UtilisateurSerializer(user).data,
            'role': 'tuteur',
            'stats': {
                'lecons_creees': lecons.count(),
                'total_eleves': total_eleves,
                'total_tentatives': total_perfs,
                'taux_reussite_global': taux_global,
            },
            'lecons_disponibles': LeconListSerializer(lecons, many=True).data,
            'top_eleves': list(top_eleves),
        })

    # ── Dashboard Élève (défaut) ──
    perfs = Performance.objects.filter(eleve=user)

    total = perfs.count()
    correctes = perfs.filter(est_correcte=True).count()
    taux = round((correctes / total * 100), 1) if total > 0 else 0
    score_moyen = perfs.aggregate(avg=Avg('score'))['avg'] or 0

    # Notions à réviser (les plus fréquemment ratées)
    notions_faibles = (
        Notion.objects
        .filter(revisions_necessaires__eleve=user)
        .annotate(nb_echecs=Count('revisions_necessaires'))
        .order_by('-nb_echecs')[:5]
    )

    # Performances récentes
    recentes = perfs.order_by('-created_at')[:10]

    # Leçons accessibles (filtrées par niveau si défini)
    lecons_qs = Lecon.objects.all()
    if user.niveau_scolaire:
        lecons_qs = lecons_qs.filter(niveau=user.niveau_scolaire)
    lecons = lecons_qs[:10]

    return Response({
        'utilisateur': UtilisateurSerializer(user).data,
        'role': 'eleve',
        'stats': {
            'exercices_tentes': total,
            'exercices_reussis': correctes,
            'taux_reussite': taux,
            'score_moyen': round(score_moyen, 1),
        },
        'notions_a_reviser': [
            {'id': n.id, 'titre': n.titre, 'lecon': n.lecon.titre, 'nb_echecs': n.nb_echecs}
            for n in notions_faibles
        ],
        'performances_recentes': PerformanceSerializer(recentes, many=True).data,
        'lecons_disponibles': LeconListSerializer(lecons, many=True).data,
    })


# ════════════════════════════════════════════════════════════
# ViewSets CRUD
# ════════════════════════════════════════════════════════════

class MatiereViewSet(viewsets.ModelViewSet):
    """CRUD complet pour les matières."""
    queryset = Matiere.objects.all()
    serializer_class = MatiereSerializer


class LeconViewSet(viewsets.ModelViewSet):
    """Liste / Détail des leçons."""
    queryset = Lecon.objects.select_related('matiere', 'auteur').prefetch_related('notions', 'exercices')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return LeconDetailSerializer
        return LeconListSerializer


class NotionViewSet(viewsets.ModelViewSet):
    """CRUD des notions (fragments de leçon)."""
    queryset = Notion.objects.select_related('lecon')
    serializer_class = NotionSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        lecon_id = self.request.query_params.get('lecon')
        if lecon_id:
            qs = qs.filter(lecon_id=lecon_id)
        return qs


class ExerciceViewSet(viewsets.ModelViewSet):
    """CRUD des exercices."""
    queryset = Exercice.objects.select_related('lecon', 'notion')
    serializer_class = ExerciceSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        lecon_id = self.request.query_params.get('lecon')
        difficulte = self.request.query_params.get('difficulte')
        if lecon_id:
            qs = qs.filter(lecon_id=lecon_id)
        if difficulte:
            qs = qs.filter(difficulte=difficulte)
        return qs


class PerformanceViewSet(viewsets.ModelViewSet):
    """CRUD des performances (suivi élève)."""
    queryset = Performance.objects.select_related('eleve', 'exercice').prefetch_related('notions_a_reviser')
    serializer_class = PerformanceSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        eleve_id = self.request.query_params.get('eleve')
        if eleve_id:
            qs = qs.filter(eleve_id=eleve_id)
        return qs


# ════════════════════════════════════════════════════════════
# 🚀 Upload de leçon (POST /api/upload-lecon/)
# ════════════════════════════════════════════════════════════

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([CanUploadLecon])
def upload_lecon(request):
    """
    Endpoint sécurisé d'upload d'une leçon PDF.
    Autorisé pour : tuteurs, admins, et élèves sans tuteur.

    Processus complet :
      1. Valider les données + fichier PDF.
      2. Extraire le texte du PDF (PyPDF2).
      3. Découper le texte en notions.
      4. Sauvegarder la Leçon + les Notions en base.
      5. Retourner la leçon complète avec ses notions.
    """
    serializer = LeconUploadSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # ── 1. Vérifier que c'est bien un PDF ──
    fichier = request.FILES.get('fichier_pdf')
    if not fichier:
        return Response(
            {'fichier_pdf': "Aucun fichier PDF fourni."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    is_valid, pdf_errors = validate_pdf_file(fichier)
    if not is_valid:
        return Response(
            {'fichier_pdf': pdf_errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # ── 2. Extraire le texte du PDF ──
    try:
        texte = extraire_texte_pdf(fichier)
    except ValueError as e:
        return Response(
            {'fichier_pdf': str(e)},
            status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    # ── 3. Résoudre la matière (existante ou nouvelle) ──
    nouvelle_matiere = serializer.validated_data.pop('nouvelle_matiere', '').strip()
    if nouvelle_matiere and not serializer.validated_data.get('matiere'):
        matiere_obj, _ = Matiere.objects.get_or_create(
            nom__iexact=nouvelle_matiere,
            defaults={'nom': nouvelle_matiere},
        )
        serializer.validated_data['matiere'] = matiere_obj

    # ── 4. Sauvegarder la leçon (auteur = utilisateur connecté) ──
    lecon = serializer.save(texte_extrait=texte, auteur=request.user)

    # ── 5. Découper en notions et les sauvegarder ──
    notions_data = decouper_en_notions(texte)
    notions_creees = []
    for nd in notions_data:
        notion = Notion.objects.create(
            lecon=lecon,
            titre=nd['titre'],
            contenu=nd['contenu'],
            ordre=nd['ordre'],
        )
        notions_creees.append(notion)

    # ── 6. Retourner le résultat complet ──
    lecon.refresh_from_db()
    return Response({
        'lecon': LeconDetailSerializer(lecon).data,
        'notions_extraites': len(notions_creees),
        'message': f"Leçon « {lecon.titre} » créée avec {len(notions_creees)} notion(s) extraites du PDF.",
    }, status=status.HTTP_201_CREATED)


# ════════════════════════════════════════════════════════════
# 🧠 Révision Intelligente (Phase 4 — Adaptation)
# ════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def revision_profil(request):
    """
    GET /api/revision/profil/
    Retourne le profil de maîtrise complet de l'élève :
    taux par notion, feedback IA, notions faibles/fortes.
    """
    feedback = generer_feedback_revision(request.user)
    maitrise = analyser_maitrise_eleve(request.user)
    return Response({
        'feedback': feedback,
        'maitrise': maitrise,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def revision_exercices(request):
    """
    GET /api/revision/exercices/
    Propose des exercices adaptatifs basés sur les faiblesses de l'élève.
    Si l'élève échoue sur une notion → exercices plus simples.
    Si l'élève excelle → exercices plus difficiles (challenge).
    """
    recommandations = proposer_exercices_adaptatifs(request.user, limit=10)

    exercices_data = []
    for rec in recommandations:
        ex = rec['exercice']
        exercices_data.append({
            'exercice': ExerciceSerializer(ex).data,
            'raison': rec['raison'],
            'notion_faible': rec['notion_faible'],
        })

    return Response({
        'nb_exercices': len(exercices_data),
        'exercices': exercices_data,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def revision_enregistrer(request):
    """
    POST /api/revision/enregistrer/
    Enregistre une performance depuis la session de révision et
    met à jour les notions_a_reviser automatiquement.

    Body: { exercice, reponse_donnee, est_correcte, score, temps_reponse? }
    """
    exercice_id = request.data.get('exercice')
    reponse_donnee = sanitize_dict(request.data.get('reponse_donnee', {}))
    est_correcte = request.data.get('est_correcte', False)
    score = request.data.get('score', 0)
    temps_reponse_raw = request.data.get('temps_reponse')

    # Convertir temps_reponse en timedelta si c'est un nombre de secondes
    from datetime import timedelta
    temps_reponse = None
    if temps_reponse_raw is not None:
        try:
            seconds = int(temps_reponse_raw)
            temps_reponse = timedelta(seconds=seconds)
        except (ValueError, TypeError):
            temps_reponse = None

    try:
        exercice = Exercice.objects.select_related('notion', 'lecon').get(id=exercice_id)
    except Exercice.DoesNotExist:
        return Response(
            {'detail': 'Exercice introuvable.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Sanitize feedback text si présent
    feedback_texte = ''
    if not est_correcte and exercice.notion:
        notion = exercice.notion
        feedback_texte = (
            f"Tu as des difficultés avec « {notion.titre} ». "
            f"Relis cette notion dans la leçon « {exercice.lecon.titre} » "
            f"puis réessaie avec des exercices plus simples."
        )

    perf = Performance.objects.create(
        eleve=request.user,
        exercice=exercice,
        reponse_donnee=reponse_donnee,
        est_correcte=est_correcte,
        score=score,
        temps_reponse=temps_reponse,
        feedback_ia=feedback_texte,
    )

    # Auto-ajouter la notion aux notions_a_reviser si échec
    if not est_correcte and exercice.notion:
        perf.notions_a_reviser.add(exercice.notion)

    return Response({
        'performance': PerformanceSerializer(perf).data,
        'feedback': feedback_texte,
        'recommendation': 'facile' if not est_correcte else 'continuer',
    }, status=status.HTTP_201_CREATED)


# ════════════════════════════════════════════════════════════
# 🤖 IA Générative — Phase 6 (RAG)
# ════════════════════════════════════════════════════════════

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_quiz_ai(request):
    """
    POST /api/ia/generer-quiz/
    Génère un quiz QCM via l'IA à partir d'une leçon existante.

    Body: { lecon_id, nb_questions? (default 5) }
    Retourne les questions au format JSON + les sauvegarde en base.
    """
    lecon_id = request.data.get('lecon_id')
    nb_questions = int(request.data.get('nb_questions', 5))

    if not lecon_id:
        return Response(
            {'detail': 'lecon_id est requis.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        lecon = Lecon.objects.get(id=lecon_id)
    except Lecon.DoesNotExist:
        return Response(
            {'detail': 'Leçon introuvable.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if not lecon.texte_extrait or len(lecon.texte_extrait.strip()) < 50:
        return Response(
            {'detail': 'Le texte de cette leçon est trop court pour générer un quiz.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Déterminer le niveau (de l'élève ou de la leçon)
    niveau = request.user.niveau_scolaire or lecon.niveau

    try:
        questions = generer_quiz_ia(
            texte_lecon=lecon.texte_extrait,
            niveau=niveau,
            nb_questions=nb_questions,
        )
    except ValueError as e:
        return Response(
            {'detail': str(e)},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    if not questions:
        return Response(
            {'detail': "L'IA n'a pas pu générer de questions. Réessayez."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Sauvegarder les exercices en base
    exercices_crees = []
    for q in questions:
        # Trouver la première notion liée (optionnel)
        notion = lecon.notions.first()

        exo = Exercice.objects.create(
            lecon=lecon,
            notion=notion,
            type_exercice='qcm',
            difficulte=q.get('difficulte', 'moyen'),
            question=q['question'],
            choix=q['choix'],
            explication=q.get('explication', ''),
        )
        exercices_crees.append(exo)

    return Response({
        'lecon': LeconListSerializer(lecon).data,
        'nb_questions': len(exercices_crees),
        'exercices': ExerciceSerializer(exercices_crees, many=True).data,
        'message': f'{len(exercices_crees)} question(s) générée(s) par l\'IA pour « {lecon.titre} ».',
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ask_ai_tutor(request):
    """
    POST /api/ia/chatbot/
    Chatbot tuteur intelligent : répond aux questions de l'élève
    en se basant sur le texte de la leçon (RAG).

    Body: { lecon_id, question, historique? }
    """
    lecon_id = request.data.get('lecon_id')
    question = sanitize_text(request.data.get('question', ''))
    historique = request.data.get('historique', [])

    if not lecon_id:
        return Response(
            {'detail': 'lecon_id est requis.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not question.strip():
        return Response(
            {'detail': 'La question ne peut pas être vide.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        lecon = Lecon.objects.get(id=lecon_id)
    except Lecon.DoesNotExist:
        return Response(
            {'detail': 'Leçon introuvable.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    texte_source = lecon.texte_extrait or ''

    # Si la leçon n'a pas de texte, utiliser le contenu des notions
    if len(texte_source.strip()) < 50:
        notions_texte = "\n\n".join(
            f"## {n.titre}\n{n.contenu}"
            for n in lecon.notions.all()
        )
        texte_source = notions_texte or texte_source

    niveau = request.user.niveau_scolaire or lecon.niveau

    reponse = chatbot_tuteur(
        texte_lecon=texte_source,
        question_eleve=question,
        historique=historique,
        niveau=niveau,
    )

    return Response({
        'question': question,
        'reponse': reponse,
        'lecon_id': lecon.id,
    })

