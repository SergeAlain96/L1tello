"""
Permissions personnalisées pour L1tello.
Gère les accès Tuteur / Élève / Admin.
"""

from rest_framework.permissions import BasePermission


class IsTutor(BasePermission):
    """Autorise uniquement les utilisateurs avec le rôle 'tuteur'."""
    message = "Seuls les tuteurs peuvent accéder à cette ressource."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'tuteur'
        )


class IsStudent(BasePermission):
    """Autorise uniquement les utilisateurs avec le rôle 'eleve'."""
    message = "Seuls les élèves peuvent accéder à cette ressource."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'eleve'
        )


class IsTutorOrAdmin(BasePermission):
    """Autorise les tuteurs et les admins."""
    message = "Accès réservé aux tuteurs et administrateurs."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ('tuteur', 'admin')
        )


class CanUploadLecon(BasePermission):
    """
    Autorise l'upload de leçon :
      - Tuteurs et Admins : toujours
      - Élèves : uniquement s'ils n'ont PAS de tuteur assigné
    """
    message = "Les élèves ayant un tuteur ne peuvent pas ajouter de PDF."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return user.peut_uploader


class IsTutorOrReadOnly(BasePermission):
    """
    Les tuteurs peuvent tout faire.
    Les élèves ne peuvent que lire (GET, HEAD, OPTIONS).
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return request.user.role in ('tuteur', 'admin')
