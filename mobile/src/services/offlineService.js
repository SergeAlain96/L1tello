/**
 * Service Hors Ligne — cache les leçons et exercices via AsyncStorage.
 *
 * Fonctionnalités :
 *  - Cache des leçons et exercices pour consultation hors ligne
 *  - File d'attente des performances (quiz) faites hors ligne
 *  - Synchronisation automatique au retour de la connexion
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

const KEYS = {
  LECONS: '@l1tello_lecons',
  LECON_DETAIL: '@l1tello_lecon_',
  EXERCICES: '@l1tello_exercices_',
  PENDING_PERFORMANCES: '@l1tello_pending_perf',
  MATIERES: '@l1tello_matieres',
};

// ══════════════════════════════════════════
// Cache : Leçons
// ══════════════════════════════════════════

/**
 * Sauvegarde la liste des leçons en cache.
 */
export async function cacheLecons(lecons) {
  try {
    await AsyncStorage.setItem(KEYS.LECONS, JSON.stringify(lecons));
  } catch (e) {
    console.warn('Erreur cache lecons:', e);
  }
}

/**
 * Récupère la liste des leçons depuis le cache.
 */
export async function getCachedLecons() {
  try {
    const data = await AsyncStorage.getItem(KEYS.LECONS);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Sauvegarde le détail d'une leçon (avec notions) en cache.
 */
export async function cacheLeconDetail(leconId, lecon) {
  try {
    await AsyncStorage.setItem(
      KEYS.LECON_DETAIL + leconId,
      JSON.stringify(lecon),
    );
  } catch (e) {
    console.warn('Erreur cache lecon detail:', e);
  }
}

/**
 * Récupère le détail d'une leçon depuis le cache.
 */
export async function getCachedLeconDetail(leconId) {
  try {
    const data = await AsyncStorage.getItem(KEYS.LECON_DETAIL + leconId);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// ══════════════════════════════════════════
// Cache : Exercices
// ══════════════════════════════════════════

/**
 * Sauvegarde les exercices d'une leçon en cache.
 */
export async function cacheExercices(leconId, exercices) {
  try {
    await AsyncStorage.setItem(
      KEYS.EXERCICES + leconId,
      JSON.stringify(exercices),
    );
  } catch (e) {
    console.warn('Erreur cache exercices:', e);
  }
}

/**
 * Récupère les exercices depuis le cache.
 */
export async function getCachedExercices(leconId) {
  try {
    const data = await AsyncStorage.getItem(KEYS.EXERCICES + leconId);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// ══════════════════════════════════════════
// Cache : Matières
// ══════════════════════════════════════════

export async function cacheMatieres(matieres) {
  try {
    await AsyncStorage.setItem(KEYS.MATIERES, JSON.stringify(matieres));
  } catch (e) {
    console.warn('Erreur cache matieres:', e);
  }
}

export async function getCachedMatieres() {
  try {
    const data = await AsyncStorage.getItem(KEYS.MATIERES);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// ══════════════════════════════════════════
// File d'attente hors ligne : Performances
// ══════════════════════════════════════════

/**
 * Ajoute une performance à la file d'attente (quiz fait hors ligne).
 */
export async function queuePerformance(perfData) {
  try {
    const existing = await AsyncStorage.getItem(KEYS.PENDING_PERFORMANCES);
    const queue = existing ? JSON.parse(existing) : [];
    queue.push({ ...perfData, queued_at: new Date().toISOString() });
    await AsyncStorage.setItem(KEYS.PENDING_PERFORMANCES, JSON.stringify(queue));
  } catch (e) {
    console.warn('Erreur queue performance:', e);
  }
}

/**
 * Récupère toutes les performances en attente.
 */
export async function getPendingPerformances() {
  try {
    const data = await AsyncStorage.getItem(KEYS.PENDING_PERFORMANCES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Vide la file d'attente après synchronisation réussie.
 */
export async function clearPendingPerformances() {
  try {
    await AsyncStorage.removeItem(KEYS.PENDING_PERFORMANCES);
  } catch (e) {
    console.warn('Erreur clear pending:', e);
  }
}

/**
 * Synchronise les performances en attente avec le backend.
 * Renvoie le nombre de performances synchronisées.
 */
export async function syncPendingPerformances(apiInstance) {
  const pending = await getPendingPerformances();
  if (pending.length === 0) return 0;

  let synced = 0;
  const failed = [];

  for (const perf of pending) {
    try {
      const { queued_at, ...data } = perf;
      await apiInstance.post('/performances/', data);
      synced++;
    } catch {
      failed.push(perf);
    }
  }

  // Garder les échoués pour la prochaine tentative
  if (failed.length > 0) {
    await AsyncStorage.setItem(
      KEYS.PENDING_PERFORMANCES,
      JSON.stringify(failed),
    );
  } else {
    await clearPendingPerformances();
  }

  return synced;
}

// ══════════════════════════════════════════
// Utilitaire : vider tout le cache
// ══════════════════════════════════════════

export async function clearAllCache() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const l1telloKeys = keys.filter((k) => k.startsWith('@l1tello_'));
    await AsyncStorage.multiRemove(l1telloKeys);
  } catch (e) {
    console.warn('Erreur clear cache:', e);
  }
}
