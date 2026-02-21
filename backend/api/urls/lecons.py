"""
Routes des leçons — upload PDF, dashboard.
"""

from django.urls import path
from .. import views

urlpatterns = [
    path('upload-lecon/', views.upload_lecon, name='upload-lecon'),
    path('dashboard/', views.dashboard, name='dashboard'),
]
