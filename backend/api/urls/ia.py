"""
Routes IA générative — quiz automatique, chatbot tuteur.
"""

from django.urls import path
from .. import views

urlpatterns = [
    path('generer-quiz/', views.generate_quiz_ai, name='generate-quiz-ai'),
    path('chatbot/', views.ask_ai_tutor, name='ask-ai-tutor'),
]
