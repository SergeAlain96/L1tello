"""
Routes d'authentification — inscription, tokens JWT, profil.
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .. import views

urlpatterns = [
    path('inscription/', views.inscription, name='inscription'),
    path('token/', TokenObtainPairView.as_view(), name='token-obtain'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('profil/', views.profil, name='profil'),
]
