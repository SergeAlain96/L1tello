"""
Routes de révision intelligente — profil de maîtrise, exercices adaptatifs.
"""

from django.urls import path
from .. import views

urlpatterns = [
    path('profil/', views.revision_profil, name='revision-profil'),
    path('exercices/', views.revision_exercices, name='revision-exercices'),
    path('enregistrer/', views.revision_enregistrer, name='revision-enregistrer'),
]
