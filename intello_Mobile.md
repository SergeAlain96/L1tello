

## 📱 **Phase 1 : Environnement & Socle Mobile (Semaine 1)**

L'objectif est d'avoir une application mobile "Hello World" qui se connecte à votre backend Django existant.

**### 1.1. Setup de l'Environnement React Native**

| Étape | Action |
| :--- | :--- |
| **\[ \]** | Installer Node.js (version LTS). |
| **\[ \]** | Installer l'environnement de développement : `npm install -g expo-cli`. |
| **\[ \]** | Installer un émulateur via Android Studio (pour Android) et/ou Xcode (pour iOS sur macOS). |
| **\[ \]** | Télécharger l'application **Expo Go** sur votre téléphone physique pour des tests rapides. |

**### 1.2. Création du Projet & Dépendances**

| Étape | Action |
| :--- | :--- |
| **\[ \]** | Créer le projet React Native : `expo init L1telloMobile`. |
| **\[ \]** | Se déplacer dans le dossier et démarrer le serveur de développement : `cd L1telloMobile` puis `expo start`. |
| **\[ \]** | Installer les dépendances de base : `npm install axios @react-navigation/native @react-navigation/stack`. |
| **\[ \]** | Vérifier que l'application "Hello World" se lance sur votre émulateur ou téléphone. |

---

## 🧠 **Phase 2 : Structure de l'App & Connexion API (Semaine 2)**

On définit la navigation de l'application et on la connecte aux données du backend.

**### 2.1. Navigation & Écrans (React Navigation)**

| Étape | Action |
| :--- | :--- |
| **\[ \]** | Mettre en place un "Stack Navigator" pour gérer la navigation entre les écrans. |
| **\[ \]** | Créer les fichiers pour les écrans principaux : `DashboardScreen`, `LeconScreen`, `QuizScreen`, `ProfilScreen`. |
| **\[ \]** | Configurer les routes de base pour pouvoir naviguer entre ces écrans. |

**### 2.2. Logique de Connexion au Backend**

| Étape | Action |
| :--- | :--- |
| **\[ \]** | Créer un service `api.js` avec Axios pour centraliser les appels vers votre backend Django. |
| **\[ \]** | Implémenter la fonction d'appel pour l'authentification des utilisateurs (login/logout). |
| **\[ \]** | Mettre en place la logique de récupération de la liste des `Matiere` et `Lecon` depuis l'API. |
| **\[ \]** | Créer la fonction d'upload de PDF vers l'endpoint `POST /api/upload-lecon/` en utilisant le sélecteur de fichiers du téléphone (`expo-document-picker`). |

---

## 🎨 **Phase 3 : Interface & Interactivité Mobile (Semaine 3)**

On développe l'expérience utilisateur native et réactive.

**### 3.1. Composants React Native**

| Étape | Action |
| :--- | :--- |
| **\[ \]** | **Dashboard :** Construire l'écran affichant la progression de l'élève (utiliser des composants de base `View`, `Text` et pourquoi pas une librairie de graphiques comme `react-native-svg-charts`). |
| **\[ \]** | **Lecteur Intelligent :** Intégrer un visualiseur de PDF (`react-native-pdf`). Ajouter une vue "Chat" à côté ou en superposition pour les explications de l'IA. |
| **\[ \]** | **Moteur de Quiz :** Développer les formulaires de quiz avec les composants `TextInput`, `TouchableOpacity` pour une correction instantanée et un feedback visuel. |

**### 3.2. Gestion de la Sécurité (Tokens)**

| Étape | Action |
| :--- | :--- |
| **\[ \]** | Utiliser `expo-secure-store` pour stocker de manière sécurisée le token d'authentification après le login. |
| **\[ \]** | Configurer un intercepteur Axios qui ajoute automatiquement le token à chaque requête envoyée au backend. |

---

## 🚀 **Phase 4 : Adaptation & Finalisation (Semaine 4)**

On peaufine l'intelligence de l'application et on assure sa robustesse.

**### 4.1. Algorithme d'Adaptation Mobile**

| Étape | Action |
| :--- | :--- |
| **\[ \]** | Coder la logique "Révision intelligente" mobile : après un quiz, si l'API renvoie une erreur sur une notion, l'application redirige l'utilisateur vers des exercices plus simples ou la section de la leçon correspondante. |
| **\[ \]** | Implémenter le **Mode Hors Ligne** : utiliser `AsyncStorage` pour stocker les leçons et exercices téléchargés. L'application doit rester fonctionnelle sans connexion internet. |
| **\[ \]** | Mettre en place une file d'attente pour synchroniser les résultats des quiz faits hors ligne dès que la connexion est rétablie. |

**### 4.2. Sécurité & Tests Multi-plateformes**

| Étape | Action |
| :--- | :--- |
| **\[ \]** | Valider toutes les entrées utilisateur pour prévenir les failles de sécurité. |
| **\[ \]** | Tester le parcours complet (Inscription -> Quiz -> Analyse) sur des émulateurs Android et iOS de différentes tailles d'écran. |

---

## **Phase 5 : Déploiement sur les Stores (Bonus)**

| Étape | Action |
| :--- | :--- |
| **\[ \]** | Préparer les ressources graphiques : icône de l'application et écran de démarrage (splash screen) dans toutes les résolutions requises. |
| **\[ \]** | Configurer les métadonnées de l'application (nom, version, permissions) dans le fichier `app.json`. |
| **\[ \]** | Générer les builds pour les stores : `expo build:android` et `expo build:ios`. |
| **\[ \]** | Créer les comptes développeur (Google Play Console & Apple Developer Program) et soumettre les applications pour validation. |