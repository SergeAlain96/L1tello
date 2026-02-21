from django.db import models
from django.contrib.auth.models import AbstractUser


# ════════════════════════════════════════════════════════════════
# 1. UTILISATEURS — Modèle personnalisé (Élève / Tuteur / Admin)
# ════════════════════════════════════════════════════════════════

class Utilisateur(AbstractUser):
    """Utilisateur custom avec rôle intégré."""

    class Role(models.TextChoices):
        ELEVE  = 'eleve',  'Élève'
        TUTEUR = 'tuteur', 'Tuteur'
        ADMIN  = 'admin',  'Administrateur'

    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.ELEVE,
    )
    niveau_scolaire = models.CharField(
        max_length=10,
        choices=[
            ('CP',   'CP'),
            ('CE1',  'CE1'),
            ('CE2',  'CE2'),
            ('CM1',  'CM1'),
            ('CM2',  'CM2'),
            ('6e',   '6ème'),
            ('5e',   '5ème'),
            ('4e',   '4ème'),
            ('3e',   '3ème'),
            ('2nde', 'Seconde'),
            ('1ere', 'Première'),
            ('Tle',  'Terminale'),
        ],
        null=True,
        blank=True,
        help_text="Niveau scolaire de l'élève.",
    )
    tuteur = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='eleves',
        limit_choices_to={'role': 'tuteur'},
        help_text="Tuteur assigné à cet élève (optionnel).",
    )
    date_naissance = models.DateField(null=True, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    class Meta:
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"

    @property
    def est_eleve(self):
        return self.role == self.Role.ELEVE

    @property
    def est_tuteur(self):
        return self.role == self.Role.TUTEUR

    @property
    def a_un_tuteur(self):
        """True si cet élève a un tuteur assigné."""
        return self.tuteur_id is not None

    @property
    def peut_uploader(self):
        """Un élève sans tuteur, un tuteur ou un admin peuvent uploader."""
        if self.role in ('tuteur', 'admin'):
            return True
        if self.role == 'eleve' and not self.a_un_tuteur:
            return True
        return False


# ════════════════════════════════════════════════════════════════
# 2. CONTENU — Matière, Leçon (PDF), Exercice
# ════════════════════════════════════════════════════════════════

class Matiere(models.Model):
    """Matière scolaire (Maths, Français, SVT …)."""
    nom = models.CharField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    icone = models.CharField(max_length=10, default='📚')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['nom']
        verbose_name = 'Matière'
        verbose_name_plural = 'Matières'

    def __str__(self):
        return f"{self.icone} {self.nom}"


class Lecon(models.Model):
    """Leçon rattachée à une matière, avec un fichier PDF source."""

    class Niveau(models.TextChoices):
        CP  = 'CP',  'CP'
        CE1 = 'CE1', 'CE1'
        CE2 = 'CE2', 'CE2'
        CM1 = 'CM1', 'CM1'
        CM2 = 'CM2', 'CM2'
        SIXIEME   = '6e',  '6ème'
        CINQUIEME = '5e',  '5ème'
        QUATRIEME = '4e',  '4ème'
        TROISIEME = '3e',  '3ème'
        SECONDE   = '2nde', 'Seconde'
        PREMIERE  = '1ere', 'Première'
        TERMINALE = 'Tle',  'Terminale'

    titre = models.CharField(max_length=255)
    matiere = models.ForeignKey(
        Matiere, on_delete=models.CASCADE, related_name='lecons',
    )
    niveau = models.CharField(
        max_length=10, choices=Niveau.choices, default=Niveau.SIXIEME,
    )
    fichier_pdf = models.FileField(upload_to='lecons/pdf/')
    texte_extrait = models.TextField(
        blank=True,
        help_text="Texte extrait automatiquement du PDF (PyPDF2).",
    )
    auteur = models.ForeignKey(
        Utilisateur, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='lecons_creees',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Leçon'
        verbose_name_plural = 'Leçons'

    def __str__(self):
        return f"{self.titre} ({self.get_niveau_display()} – {self.matiere.nom})"


class Notion(models.Model):
    """
    Notion découpée automatiquement depuis le texte d'une Leçon.
    C'est la brique élémentaire utilisée par le tuteur intelligent.
    """
    lecon = models.ForeignKey(
        Lecon, on_delete=models.CASCADE, related_name='notions',
    )
    titre = models.CharField(max_length=255)
    contenu = models.TextField(
        help_text="Fragment de texte correspondant à cette notion.",
    )
    ordre = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['lecon', 'ordre']
        verbose_name = 'Notion'
        verbose_name_plural = 'Notions'

    def __str__(self):
        return f"[{self.lecon.titre}] {self.titre}"


class Exercice(models.Model):
    """Exercice de type QCM rattaché à une leçon / notion."""

    class TypeExo(models.TextChoices):
        QCM       = 'qcm',       'QCM'
        VRAI_FAUX = 'vrai_faux',  'Vrai / Faux'
        TEXTE     = 'texte',      'Réponse libre'

    class Difficulte(models.TextChoices):
        FACILE     = 'facile',     'Facile'
        MOYEN      = 'moyen',      'Moyen'
        DIFFICILE  = 'difficile',  'Difficile'

    lecon = models.ForeignKey(
        Lecon, on_delete=models.CASCADE, related_name='exercices',
    )
    notion = models.ForeignKey(
        Notion, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='exercices',
    )
    type_exercice = models.CharField(
        max_length=15, choices=TypeExo.choices, default=TypeExo.QCM,
    )
    difficulte = models.CharField(
        max_length=15, choices=Difficulte.choices, default=Difficulte.MOYEN,
    )
    question = models.TextField()
    choix = models.JSONField(
        default=list, blank=True,
        help_text='Liste de choix pour QCM : [{"texte": "…", "correct": true/false}, …]',
    )
    explication = models.TextField(
        blank=True,
        help_text="Explication affichée après la correction.",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['lecon', 'difficulte']
        verbose_name = 'Exercice'
        verbose_name_plural = 'Exercices'

    def __str__(self):
        return f"[{self.get_type_exercice_display()}] {self.question[:60]}…"


# ════════════════════════════════════════════════════════════════
# 3. SUIVI — Performance (scores, erreurs, notions à réviser)
# ════════════════════════════════════════════════════════════════

class Performance(models.Model):
    """
    Enregistre la tentative d'un élève sur un exercice.
    Sert de base à l'algorithme d'adaptation (IA).
    """
    eleve = models.ForeignKey(
        Utilisateur, on_delete=models.CASCADE, related_name='performances',
    )
    exercice = models.ForeignKey(
        Exercice, on_delete=models.CASCADE, related_name='performances',
    )
    reponse_donnee = models.JSONField(
        help_text="Réponse brute de l'élève (index choisi, texte, etc.).",
    )
    est_correcte = models.BooleanField()
    score = models.FloatField(
        default=0,
        help_text="Score de 0 à 100 pour cette tentative.",
    )
    temps_reponse = models.DurationField(
        null=True, blank=True,
        help_text="Temps mis par l'élève pour répondre.",
    )
    notions_a_reviser = models.ManyToManyField(
        Notion, blank=True, related_name='revisions_necessaires',
        help_text="Notions identifiées comme non maîtrisées par l'IA.",
    )
    feedback_ia = models.TextField(
        blank=True,
        help_text="Commentaire généré par l'IA pour guider la révision.",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Performance'
        verbose_name_plural = 'Performances'

    def __str__(self):
        status = "✅" if self.est_correcte else "❌"
        return f"{status} {self.eleve.username} → {self.exercice.question[:40]}…"
