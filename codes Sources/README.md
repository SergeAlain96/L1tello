## 🎓 Présentation Générale : L1tello

L1tello est une solution éducative numérique conçue pour accompagner les élèves du primaire et du secondaire dans leur apprentissage quotidien. Le projet se définit comme un tuteur intelligent agissant comme un assistant pédagogique personnalisé, disponible à tout moment pour expliquer des leçons et suivre la progression de l'apprenant.

### Objectifs du Projet

Personnalisation : Offrir un accompagnement pédagogique sur mesure adapté au rythme de chaque élève.


Soutien Scolaire : Réduire les difficultés d'apprentissage et prévenir le décrochage scolaire.


Complémentarité : Appuyer le travail des enseignants sans chercher à s'y substituer.

## 🧠 Fonctionnalités Majeures & Innovation
L1tello intègre des fonctionnalités avancées pour transformer des contenus statiques en expériences interactives.


Explications et PDF (Style NotebookLM) : L'application permet d'introduire des leçons selon le programme officiel. Grâce à l'intégration de fichiers PDF, le système peut extraire et expliquer le contenu textuel de manière fluide.


Exercices Interactifs : Proposer des quiz et des exercices avec un système de correction automatique immédiate.


Intelligence Artificielle & Adaptabilité : Utilisation de l'IA pour analyser les erreurs de l'élève et proposer des contenus ciblés. Si l'élève ne maîtrise pas une notion, le système adapte le niveau et propose une révision intelligente.


Mode Hors Ligne : Une architecture pensée pour fonctionner dans les zones à faible connectivité.


Multilingue : Possibilité d'intégrer à terme le français et les langues locales pour une meilleure inclusion.

## 🛠 Architecture Technique Déployée
Le projet repose sur une architecture moderne "découplée", idéale pour les performances et la scalabilité.

### 1. Back-end : Django (Python) & MySQL
Django sert de "cerveau" pour la gestion des données complexes et de l'IA.


API REST : Utilisation de Django REST Framework pour exposer des endpoints sécurisés au format JSON.


Sécurité : Authentification robuste, protection contre les injections SQL, et gestion des permissions avec des Policies.


Base de données : MySQL pour le stockage structuré des utilisateurs, des leçons et des historiques de performances.

### 2. Front-end : Reactjs
React gère l'interface utilisateur dynamique et réactive.


Single Page Application (SPA) : Navigation fluide sans rechargement de page pour une expérience utilisateur moderne.


Communication API : Utilisation d'Axios avec des intercepteurs pour gérer les tokens d'authentification et les requêtes vers Django.


🤖 Phase 6 : Intégration des Rôles & IA Générative (Semaine 3-4)
C'est ici qu'on implémente la distinction Tuteur/Élève et qu'on branche le cerveau de l'IA (RAG).

6.1. Gestion des Acteurs (Backend & Frontend)
[ ] Mise à jour du Modèle User : Modifier models.py pour ajouter le champ role(CHOICES: 'TUTEUR', 'ELEVE') et niveau_scolaire.

[ ] Permissions API : Créer des permissions personnalisées dans Django ( IsTutor, IsStudent) pour restreindre l'accès (ex: un élève CP1 ne peut pas télécharger, seul son tuteur le peut).

[ ] Vues Conditionnelles (React) : Adaptateur le Dashboard : Si Tuteur (Upload leçon, Suivi) vs Si Élève (Mes leçons, Chatbot, Quiz).

6.2. Le Cerveau IA (Backend Django)
[ ] Configuration LangChain : Configurer la clé API (Google Gemini ou OpenAI) dans settings.py ou .env.

[ ] Endpoint Génération (RAG) : Coder la vue generate_quiz_ai qui lit le PDF et construit un prompt pour l'IA ( "Crée 5 QCM niveau [Classe] based sur ce texte au format JSON" ).

[ ] Endpoint Chatbot (RAG) : Coder la vue ask_ai_tutorqui prend l'historique de chat + le texte du PDF pour répondre contextuellement.

6.3. Interface IA (Frontend React)
[ ] Bouton Magique : Intégrer le composant QuizGenerator.jsx(avec indicateur de chargement) dans la vue de la leçon.

[ ] Side-Panel Chat : Intégrer le composant AIChatBot.jsxà droite de la visionneuse PDF (style NotebookLM).

[ ] Rendu du Quiz : Créer un composant qui prend le JSON de l'IA et l'affiche sous forme de formulaire interactif (QCM).

