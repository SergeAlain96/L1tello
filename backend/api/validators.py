"""
Validators & security utilities for L1tello API.

Protège contre :
  - XSS (balises HTML/script dans les champs texte)
  - Injections SQL (Django ORM fait déjà le gros du travail)
  - Fichiers malveillants (validation type MIME réel)
  - Entrées trop longues / malformées
"""

import re
import html


# ══════════════════════════════════════════
# Sanitisation de texte (anti-XSS)
# ══════════════════════════════════════════

# Pattern pour détecter les balises HTML/script
HTML_TAG_RE = re.compile(r'<[^>]+>', re.IGNORECASE)
SCRIPT_RE = re.compile(
    r'(javascript\s*:|on\w+\s*=|<\s*script|<\s*iframe|<\s*object|<\s*embed|<\s*link|<\s*img\s[^>]*onerror)',
    re.IGNORECASE,
)


def sanitize_text(value):
    """
    Nettoie un texte en supprimant les balises HTML et
    en échappant les caractères dangereux.
    """
    if not isinstance(value, str):
        return value
    # Supprimer les balises HTML
    cleaned = HTML_TAG_RE.sub('', value)
    # Échapper les entités HTML restantes
    cleaned = html.escape(cleaned, quote=True)
    return cleaned.strip()


def contains_xss(value):
    """Vérifie si un texte contient des patterns XSS potentiels."""
    if not isinstance(value, str):
        return False
    return bool(SCRIPT_RE.search(value))


def sanitize_dict(data):
    """Sanitize récursif d'un dictionnaire (pour les champs JSON)."""
    if isinstance(data, dict):
        return {k: sanitize_dict(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_dict(item) for item in data]
    elif isinstance(data, str):
        return sanitize_text(data)
    return data


# ══════════════════════════════════════════
# Validation de fichier PDF
# ══════════════════════════════════════════

ALLOWED_PDF_MAGIC = b'%PDF'
MAX_PDF_SIZE = 20 * 1024 * 1024  # 20 Mo


def validate_pdf_file(fichier):
    """
    Valide qu'un fichier uploadé est vraiment un PDF.
    Retourne (is_valid, error_message).
    """
    errors = []

    # Vérifier la taille
    if fichier.size > MAX_PDF_SIZE:
        errors.append(f"Le fichier dépasse la taille maximale de 20 Mo ({fichier.size // (1024*1024)} Mo).")

    # Vérifier l'extension
    if not fichier.name.lower().endswith('.pdf'):
        errors.append("Le fichier doit avoir l'extension .pdf.")

    # Vérifier le magic number (signature réelle du fichier)
    try:
        first_bytes = fichier.read(4)
        fichier.seek(0)  # Rembobiner pour la suite
        if first_bytes != ALLOWED_PDF_MAGIC:
            errors.append("Le contenu du fichier ne correspond pas à un PDF valide.")
    except Exception:
        errors.append("Impossible de lire le fichier.")

    return (len(errors) == 0, errors)


# ══════════════════════════════════════════
# Validation des champs communs
# ══════════════════════════════════════════

USERNAME_RE = re.compile(r'^[a-zA-Z0-9_@.+-]{3,50}$')
EMAIL_RE = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')


def validate_username(value):
    """Vérifie qu'un username est clean (pas de HTML, longueur ok)."""
    if not USERNAME_RE.match(value):
        return False, "Le nom d'utilisateur doit contenir entre 3 et 50 caractères alphanumériques."
    if contains_xss(value):
        return False, "Le nom d'utilisateur contient des caractères non autorisés."
    return True, None


def validate_safe_string(value, max_length=500, field_name='champ'):
    """Valide une chaîne de texte générique."""
    if not isinstance(value, str):
        return True, None
    if len(value) > max_length:
        return False, f"Le {field_name} ne peut pas dépasser {max_length} caractères."
    if contains_xss(value):
        return False, f"Le {field_name} contient du contenu non autorisé."
    return True, None
