## 🛠 Phase 1 : Environnement & Socle Technique (Semaine 1)
L'objectif est d'avoir une application "Hello World" où le Front communique avec le Back.

### 1.1. Setup Windows & Backend (Django)
[ ] Installer Python 3.14 (ou 3.12+) et cocher "Add to PATH".

[ ] Créer le dossier L1tello et l'environnement virtuel : python -m venv venv.

[ ] Activer l'environnement : .\venv\Scripts\activate.

[ ] Installer les dépendances : pip install django djangorestframework django-cors-headers mysqlclient pypdf2 langchain.

[ ] Créer le projet Django : django-admin startproject core ..

[ ] Configurer MySQL dans settings.py.

### 1.2. Setup Frontend (React)
[ ] Installer Node.js (LTS).

[ ] Créer le projet : npm create vite@latest frontend -- --template react.

[ ] Installer les outils de base : npm install axios react-router-dom TailwindCss.

## 🧠 Phase 2 : Modélisation & Intelligence (Semaine 2)
On définit comment les données sont structurées pour permettre l'adaptation du niveau.

### 2.1. Base de Données (Django Models)
[ ] Utilisateurs : Créer un modèle personnalisé (Élève/Tuteur/Admin).

[ ] Contenu : Tables Matiere, Lecon (avec champ PDF) et Exercice.

[ ] Suivi : Table Performance pour stocker les scores, erreurs et notions à réviser (IA).

### 2.2. Logique "NotebookLM" (Parsing PDF)
[ ] Créer une fonction de service qui utilise PyPDF2 pour extraire le texte d'un PDF uploadé.

[ ] Mettre en place un endpoint d'upload sécurisé : POST /api/upload-lecon/.

[ ] Innovation : Coder la logique qui découpe le texte du PDF en "notions" pour le tuteur intelligent.

## 🎨 Phase 3 : Interface & Interactivité (Semaine 3)
On crée l'expérience utilisateur ludique et réactive.
Un Design Ultra Moderne avec un bon thème.

### 3.1. Composants React
[ ] Dashboard : Afficher la progression globale de l'élève.

[ ] Lecteur Intelligent : Afficher le PDF et un chat d'explication à côté.

[ ] Moteur de Quiz : Formulaires interactifs avec correction immédiate (Feedback).

### 3.2. Connexion API (Axios)
[ ] Configurer un intercepteur Axios pour gérer les tokens de sécurité.

[ ] Connecter le frontend aux endpoints Django (Leçons, Exercices, Profil).

## 🚀 Phase 4 : Adaptation & Finalisation (Semaine 4)
C'est ici qu'on peaufine l'intelligence et le déploiement.

### 4.1. Algorithme d'Adaptation
[ ] Coder la logique "Révision intelligente" : si un élève échoue sur une notion du PDF, l'application lui propose automatiquement des exercices plus simples.

[ ] Implémenter le Mode Hors Ligne via le localStorage de React pour les zones à faible connectivité.

### 4.2. Sécurité & Tests
[ ] Valider les entrées (XSS/SQL Injection).

[ ] Tester le parcours complet : Inscription -> Upload PDF -> Quiz -> Analyse Erreurs.

## Phase 5 : Déploiement (Bonus +3 pts)
[ ] Choisir un hébergeur (OVH, Contabo).

[ ] Configurer Nginx et Gunicorn sur le serveur.

[ ] Installer un certificat SSL (HTTPS) gratuit avec Certbot.