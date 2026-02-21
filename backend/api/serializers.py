from rest_framework import serializers
from .models import Utilisateur, Matiere, Lecon, Notion, Exercice, Performance
from .validators import sanitize_text, sanitize_dict, contains_xss, validate_safe_string


# ════════════════════════════════════════
# Mixin de sécurité (anti-XSS)
# ════════════════════════════════════════

class SanitizeMixin:
    """Mixin qui sanitize tous les champs texte avant validation."""

    SANITIZE_FIELDS = []  # Liste des champs str à nettoyer

    def validate(self, attrs):
        attrs = super().validate(attrs)
        for field_name in self.SANITIZE_FIELDS:
            value = attrs.get(field_name)
            if isinstance(value, str):
                if contains_xss(value):
                    raise serializers.ValidationError(
                        {field_name: "Ce champ contient du contenu non autorisé."}
                    )
                attrs[field_name] = sanitize_text(value)
            elif isinstance(value, (dict, list)):
                attrs[field_name] = sanitize_dict(value)
        return attrs


# ════════════════════════════════════════
# Utilisateur
# ════════════════════════════════════════

class UtilisateurSerializer(serializers.ModelSerializer):
    peut_uploader = serializers.BooleanField(read_only=True)
    tuteur_nom = serializers.CharField(source='tuteur.username', read_only=True, default=None)

    class Meta:
        model = Utilisateur
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'niveau_scolaire', 'date_naissance', 'avatar',
            'tuteur', 'tuteur_nom', 'peut_uploader',
        ]
        read_only_fields = ['id', 'peut_uploader', 'tuteur_nom']


class InscriptionSerializer(SanitizeMixin, serializers.ModelSerializer):
    """Serializer pour l'inscription (écriture du mot de passe)."""
    password = serializers.CharField(write_only=True, min_length=6)
    SANITIZE_FIELDS = ['username', 'email', 'first_name', 'last_name']

    class Meta:
        model = Utilisateur
        fields = [
            'id', 'username', 'email', 'password',
            'first_name', 'last_name', 'role', 'niveau_scolaire', 'date_naissance',
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = Utilisateur(**validated_data)
        user.set_password(password)
        user.save()
        return user


# ════════════════════════════════════════
# Matière
# ════════════════════════════════════════

class MatiereSerializer(SanitizeMixin, serializers.ModelSerializer):
    nb_lecons = serializers.IntegerField(source='lecons.count', read_only=True)
    SANITIZE_FIELDS = ['nom', 'description']

    class Meta:
        model = Matiere
        fields = ['id', 'nom', 'description', 'icone', 'nb_lecons', 'created_at']
        read_only_fields = ['id', 'created_at']


# ════════════════════════════════════════
# Notion
# ════════════════════════════════════════

class NotionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notion
        fields = ['id', 'lecon', 'titre', 'contenu', 'ordre', 'created_at']
        read_only_fields = ['id', 'created_at']


# ════════════════════════════════════════
# Leçon
# ════════════════════════════════════════

class LeconListSerializer(serializers.ModelSerializer):
    """Version légère pour les listes."""
    matiere_nom = serializers.CharField(source='matiere.nom', read_only=True)
    nb_notions = serializers.IntegerField(source='notions.count', read_only=True)
    nb_exercices = serializers.IntegerField(source='exercices.count', read_only=True)

    class Meta:
        model = Lecon
        fields = [
            'id', 'titre', 'matiere', 'matiere_nom', 'niveau',
            'nb_notions', 'nb_exercices', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class LeconDetailSerializer(serializers.ModelSerializer):
    """Version complète avec notions et exercices imbriqués."""
    matiere_nom = serializers.CharField(source='matiere.nom', read_only=True)
    notions = NotionSerializer(many=True, read_only=True)

    class Meta:
        model = Lecon
        fields = [
            'id', 'titre', 'matiere', 'matiere_nom', 'niveau',
            'fichier_pdf', 'texte_extrait', 'auteur',
            'notions', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'texte_extrait', 'created_at', 'updated_at']


class LeconUploadSerializer(SanitizeMixin, serializers.ModelSerializer):
    """Serializer pour l'upload d'une leçon avec fichier PDF."""
    SANITIZE_FIELDS = ['titre', 'nouvelle_matiere']
    nouvelle_matiere = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Lecon
        fields = ['id', 'titre', 'matiere', 'niveau', 'fichier_pdf', 'nouvelle_matiere']
        read_only_fields = ['id']
        extra_kwargs = {
            'matiere': {'required': False, 'allow_null': True},
        }

    def validate(self, data):
        matiere = data.get('matiere')
        nouvelle_matiere = data.get('nouvelle_matiere', '').strip()
        if not matiere and not nouvelle_matiere:
            raise serializers.ValidationError(
                {'matiere': 'Sélectionnez une matière existante ou saisissez un nouveau nom.'}
            )
        return data


# ════════════════════════════════════════
# Exercice
# ════════════════════════════════════════

class ExerciceSerializer(SanitizeMixin, serializers.ModelSerializer):
    notion_titre = serializers.CharField(
        source='notion.titre', read_only=True, default=None,
    )
    SANITIZE_FIELDS = ['question', 'explication', 'choix']

    class Meta:
        model = Exercice
        fields = [
            'id', 'lecon', 'notion', 'notion_titre',
            'type_exercice', 'difficulte',
            'question', 'choix', 'explication', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


# ════════════════════════════════════════
# Performance (suivi IA)
# ════════════════════════════════════════

class PerformanceSerializer(SanitizeMixin, serializers.ModelSerializer):
    eleve_nom = serializers.CharField(
        source='eleve.username', read_only=True,
    )
    notions_a_reviser_details = NotionSerializer(
        source='notions_a_reviser', many=True, read_only=True,
    )
    SANITIZE_FIELDS = ['reponse_donnee', 'feedback_ia']

    class Meta:
        model = Performance
        fields = [
            'id', 'eleve', 'eleve_nom', 'exercice',
            'reponse_donnee', 'est_correcte', 'score',
            'temps_reponse', 'notions_a_reviser', 'notions_a_reviser_details',
            'feedback_ia', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']
