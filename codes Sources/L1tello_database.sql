-- ============================================
-- L1TELLO - Script de création de la BDD
-- Exécuter en tant qu'administrateur MySQL
-- Version: 1.0 | Projet académique
-- ============================================

-- 1. Création de la base de données
CREATE DATABASE IF NOT EXISTS l1tello_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 2. Création de l'utilisateur applicatif
CREATE USER IF NOT EXISTS 'l1tello_user'@'localhost'
  IDENTIFIED BY 'VotreMotDePasseSecurise123!';

-- 3. Attribution des droits
GRANT ALL PRIVILEGES ON l1tello_db.* TO 'l1tello_user'@'localhost';
FLUSH PRIVILEGES;

-- 4. Sélection de la base
USE l1tello_db;

-- ============================================
-- TABLES PRINCIPALES (ordre respectant les FK)
-- ============================================

-- Table des utilisateurs (remplace auth_user de Django)
CREATE TABLE IF NOT EXISTS api_customuser (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    password        VARCHAR(128)    NOT NULL,
    last_login      DATETIME        NULL,
    is_superuser    TINYINT(1)      NOT NULL DEFAULT 0,
    email           VARCHAR(254)    NOT NULL UNIQUE,
    first_name      VARCHAR(150)    NOT NULL DEFAULT '',
    last_name       VARCHAR(150)    NOT NULL DEFAULT '',
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    is_staff        TINYINT(1)      NOT NULL DEFAULT 0,
    date_joined     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    role            ENUM('TUTEUR','ELEVE','ADMIN') NOT NULL DEFAULT 'ELEVE',
    niveau_scolaire VARCHAR(50)     NULL COMMENT 'Ex: CP1, CM2, 3eme, Terminale',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Utilisateurs de la plateforme L1tello';

-- Table des matières scolaires
CREATE TABLE IF NOT EXISTS api_matiere (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nom         VARCHAR(100)    NOT NULL,
    description TEXT            NULL,
    icone       VARCHAR(50)     NULL COMMENT 'Nom icone ou emoji',
    couleur     VARCHAR(7)      NULL COMMENT 'Code couleur HEX ex: #1A73E8',
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Matières scolaires disponibles';

-- Table des leçons
CREATE TABLE IF NOT EXISTS api_lecon (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    titre           VARCHAR(255)    NOT NULL,
    matiere_id      BIGINT UNSIGNED NOT NULL,
    tuteur_id       BIGINT UNSIGNED NOT NULL COMMENT 'Tuteur ayant uploadé la leçon',
    fichier_pdf     VARCHAR(500)    NOT NULL COMMENT 'Chemin vers le fichier PDF stocké',
    contenu_texte   LONGTEXT        NULL COMMENT 'Texte extrait du PDF par PyPDF2',
    niveau_scolaire VARCHAR(50)     NULL COMMENT 'Niveau cible de la leçon',
    is_published    TINYINT(1)      NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (matiere_id) REFERENCES api_matiere(id) ON DELETE RESTRICT,
    FOREIGN KEY (tuteur_id)  REFERENCES api_customuser(id) ON DELETE RESTRICT
) ENGINE=InnoDB COMMENT='Leçons avec fichiers PDF associés';

-- Table des exercices et QCM
CREATE TABLE IF NOT EXISTS api_exercice (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    lecon_id        BIGINT UNSIGNED NOT NULL,
    type            ENUM('QCM','VRAI_FAUX','TEXTE_LIBRE','ASSOCIATION') NOT NULL DEFAULT 'QCM',
    titre           VARCHAR(255)    NOT NULL,
    contenu_json    JSON            NOT NULL COMMENT 'Structure: {question, choices[], correct_answer, explanation}',
    difficulte      ENUM('FACILE','MOYEN','DIFFICILE') NOT NULL DEFAULT 'MOYEN',
    source          ENUM('MANUEL','IA_GENEREE') NOT NULL DEFAULT 'MANUEL',
    points          TINYINT         NOT NULL DEFAULT 1,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lecon_id) REFERENCES api_lecon(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Exercices et QCM liés aux leçons';

-- Table des performances et résultats
CREATE TABLE IF NOT EXISTS api_performance (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    eleve_id        BIGINT UNSIGNED NOT NULL,
    exercice_id     BIGINT UNSIGNED NOT NULL,
    score           TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Score obtenu (0-100)',
    temps_secondes  SMALLINT        NULL COMMENT 'Temps pour compléter en secondes',
    erreurs_json    JSON            NULL COMMENT 'Détail des erreurs et notions non maîtrisées',
    notions_a_revoir JSON           NULL COMMENT 'Notions ciblées pour révision intelligente',
    synced          TINYINT(1)      NOT NULL DEFAULT 1 COMMENT '0 = fait hors ligne, non encore synchronisé',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (eleve_id)    REFERENCES api_customuser(id) ON DELETE CASCADE,
    FOREIGN KEY (exercice_id) REFERENCES api_exercice(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Historique des résultats des élèves';

-- Table d'historique du chatbot IA
CREATE TABLE IF NOT EXISTS api_chat_history (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    eleve_id    BIGINT UNSIGNED NOT NULL,
    lecon_id    BIGINT UNSIGNED NOT NULL,
    role        ENUM('user','assistant') NOT NULL,
    contenu     TEXT    NOT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (eleve_id) REFERENCES api_customuser(id) ON DELETE CASCADE,
    FOREIGN KEY (lecon_id) REFERENCES api_lecon(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Historique des conversations avec le tuteur IA';

-- ============================================
-- DONNÉES D'INITIALISATION
-- ============================================

INSERT INTO api_matiere (nom, description, icone, couleur) VALUES
('Mathématiques', 'Arithmétique, Algèbre, Géométrie', '📐', '#1A73E8'),
('Français', 'Grammaire, Orthographe, Littérature', '📚', '#E8430F'),
('Sciences', 'Physique-Chimie, SVT', '🔬', '#34A853'),
('Histoire-Géographie', 'Histoire, Géographie, Éducation civique', '🌍', '#FBBC05'),
('Anglais', 'Langue vivante étrangère', '🇬🇧', '#9C27B0');

-- ============================================
-- INDEX pour les performances de requêtes
-- ============================================
CREATE INDEX idx_lecon_matiere    ON api_lecon(matiere_id);
CREATE INDEX idx_lecon_tuteur     ON api_lecon(tuteur_id);
CREATE INDEX idx_exercice_lecon   ON api_exercice(lecon_id);
CREATE INDEX idx_perf_eleve       ON api_performance(eleve_id);
CREATE INDEX idx_perf_exercice    ON api_performance(exercice_id);
CREATE INDEX idx_chat_eleve_lecon ON api_chat_history(eleve_id, lecon_id);

SELECT 'Base de données L1tello créée avec succès !' AS statut;
