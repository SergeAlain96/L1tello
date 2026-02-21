from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Utilisateur, Matiere, Lecon, Notion, Exercice, Performance


# ════════════════════════════════════════
# Utilisateur (Custom User)
# ════════════════════════════════════════

@admin.register(Utilisateur)
class UtilisateurAdmin(UserAdmin):
    list_display = ['username', 'email', 'role', 'niveau_scolaire', 'tuteur', 'is_active', 'date_joined']
    list_filter = ['role', 'niveau_scolaire', 'is_active']
    fieldsets = UserAdmin.fieldsets + (
        ('Infos L1tello', {'fields': ('role', 'niveau_scolaire', 'tuteur', 'date_naissance', 'avatar')}),
    )


# ════════════════════════════════════════
# Contenu pédagogique
# ════════════════════════════════════════

@admin.register(Matiere)
class MatiereAdmin(admin.ModelAdmin):
    list_display = ['icone', 'nom', 'created_at']
    search_fields = ['nom']


class NotionInline(admin.TabularInline):
    model = Notion
    extra = 0
    fields = ['ordre', 'titre', 'contenu']


@admin.register(Lecon)
class LeconAdmin(admin.ModelAdmin):
    list_display = ['titre', 'matiere', 'niveau', 'auteur', 'created_at']
    list_filter = ['matiere', 'niveau']
    search_fields = ['titre']
    inlines = [NotionInline]


@admin.register(Notion)
class NotionAdmin(admin.ModelAdmin):
    list_display = ['titre', 'lecon', 'ordre']
    list_filter = ['lecon__matiere']


@admin.register(Exercice)
class ExerciceAdmin(admin.ModelAdmin):
    list_display = ['question_courte', 'lecon', 'type_exercice', 'difficulte']
    list_filter = ['type_exercice', 'difficulte', 'lecon__matiere']

    @admin.display(description='Question')
    def question_courte(self, obj):
        return obj.question[:60] + '…' if len(obj.question) > 60 else obj.question


# ════════════════════════════════════════
# Suivi
# ════════════════════════════════════════

@admin.register(Performance)
class PerformanceAdmin(admin.ModelAdmin):
    list_display = ['eleve', 'exercice_court', 'est_correcte', 'score', 'created_at']
    list_filter = ['est_correcte', 'created_at']

    @admin.display(description='Exercice')
    def exercice_court(self, obj):
        return obj.exercice.question[:40] + '…'
