"""
Service d'extraction de texte depuis des fichiers PDF.
Utilise PyPDF2 pour parser chaque page du document.
"""

import re
import logging
from PyPDF2 import PdfReader

logger = logging.getLogger(__name__)


def extraire_texte_pdf(fichier) -> str:
    """
    Extrait tout le texte d'un fichier PDF uploadé.

    Args:
        fichier: Un objet file-like (UploadedFile Django ou chemin).

    Returns:
        Le texte brut du PDF, nettoyé.
    """
    try:
        reader = PdfReader(fichier)
        pages_texte = []

        for i, page in enumerate(reader.pages):
            texte_page = page.extract_text()
            if texte_page:
                pages_texte.append(texte_page.strip())
            else:
                logger.warning(f"Page {i + 1} : aucun texte extrait (image ?).")

        texte_complet = "\n\n".join(pages_texte)
        texte_complet = _nettoyer_texte(texte_complet)

        logger.info(
            f"PDF traité : {len(reader.pages)} pages, "
            f"{len(texte_complet)} caractères extraits."
        )
        return texte_complet

    except Exception as e:
        logger.error(f"Erreur lors de l'extraction PDF : {e}")
        raise ValueError(f"Impossible de lire le PDF : {e}")


def _nettoyer_texte(texte: str) -> str:
    """Nettoie le texte brut extrait du PDF."""
    # Supprimer les multiples espaces
    texte = re.sub(r'[ \t]+', ' ', texte)
    # Supprimer les lignes vides multiples
    texte = re.sub(r'\n{3,}', '\n\n', texte)
    # Supprimer les espaces en début/fin de ligne
    texte = "\n".join(line.strip() for line in texte.splitlines())
    return texte.strip()
