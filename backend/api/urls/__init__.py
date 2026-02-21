"""
Routes API L1tello — point d'entrée principal.

Organisation :
  /api/hello/          → Test de santé
  /api/auth/           → Inscription, JWT, Profil
  /api/dashboard/      → Statistiques de progression
  /api/upload-lecon/   → Upload de PDF
  /api/revision/       → Révision intelligente
  /api/ia/             → IA générative (quiz, chatbot)
  /api/matieres/       → CRUD Matières
  /api/lecons/         → CRUD Leçons
  /api/notions/        → CRUD Notions
  /api/exercices/      → CRUD Exercices
  /api/performances/   → CRUD Performances
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .. import views

# ── Router DRF pour les ViewSets CRUD ──
router = DefaultRouter()
router.register(r'matieres', views.MatiereViewSet)
router.register(r'lecons', views.LeconViewSet)
router.register(r'notions', views.NotionViewSet)
router.register(r'exercices', views.ExerciceViewSet)
router.register(r'performances', views.PerformanceViewSet)

urlpatterns = [
    # ── Test ──
    path('hello/', views.hello_world, name='hello-world'),

    # ── Auth (inscription, token, profil) ──
    path('auth/', include('api.urls.auth')),

    # ── Gestion des leçons (upload, dashboard) ──
    path('', include('api.urls.lecons')),

    # ── Révision intelligente ──
    path('revision/', include('api.urls.revision')),

    # ── IA générative ──
    path('ia/', include('api.urls.ia')),

    # ── CRUD ViewSets (router DRF) ──
    path('', include(router.urls)),
]
