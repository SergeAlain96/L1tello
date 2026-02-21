/**
 * Service de cache hors-ligne via localStorage.
 *
 * Permet de :
 *  - Sauvegarder les données API en local (leçons, notions, exercices, profil)
 *  - Les récupérer quand le réseau est indisponible
 *  - Gérer un TTL (durée de validité) pour éviter les données périmées
 *  - Détecter l'état du réseau
 */

const PREFIX = 'l1tello_cache_';
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24h en ms

// ══════════════════════════════════════════
// Core cache methods
// ══════════════════════════════════════════

export function cacheSet(key, data, ttl = DEFAULT_TTL) {
  try {
    const entry = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    localStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch {
    // localStorage plein → nettoyer les anciennes entrées
    cacheCleanExpired();
    try {
      const entry = { data, timestamp: Date.now(), ttl };
      localStorage.setItem(PREFIX + key, JSON.stringify(entry));
    } catch {
      // Abandon silencieux
    }
  }
}

export function cacheGet(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;

    const entry = JSON.parse(raw);
    const age = Date.now() - entry.timestamp;

    if (age > entry.ttl) {
      localStorage.removeItem(PREFIX + key);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

export function cacheRemove(key) {
  localStorage.removeItem(PREFIX + key);
}

export function cacheCleanExpired() {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(PREFIX));
  for (const key of keys) {
    try {
      const entry = JSON.parse(localStorage.getItem(key));
      if (Date.now() - entry.timestamp > entry.ttl) {
        localStorage.removeItem(key);
      }
    } catch {
      localStorage.removeItem(key);
    }
  }
}

export function cacheCleanAll() {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(PREFIX));
  keys.forEach((k) => localStorage.removeItem(k));
}

// ══════════════════════════════════════════
// Network detection
// ══════════════════════════════════════════

export function isOnline() {
  return navigator.onLine;
}

export function onNetworkChange(callback) {
  window.addEventListener('online', () => callback(true));
  window.addEventListener('offline', () => callback(false));
  return () => {
    window.removeEventListener('online', () => callback(true));
    window.removeEventListener('offline', () => callback(false));
  };
}

// ══════════════════════════════════════════
// API-aware fetch with cache fallback
// ══════════════════════════════════════════

/**
 * Fetch avec fallback offline.
 * 1. Si online → appel API normal, met en cache, retourne
 * 2. Si offline ou erreur réseau → retourne le cache local
 *
 * @param {AxiosInstance} api - Instance Axios
 * @param {string} url - URL relative (/lecons/, /exercices/...)
 * @param {object} options - { ttl, forceRefresh }
 * @returns {Promise<{data, fromCache: boolean}>}
 */
export async function fetchWithCache(api, url, options = {}) {
  const { ttl = DEFAULT_TTL, forceRefresh = false } = options;
  const cacheKey = url.replace(/\//g, '_').replace(/\?/g, '_');

  // Si pas de forceRefresh, tenter le cache d'abord si offline
  if (!isOnline() && !forceRefresh) {
    const cached = cacheGet(cacheKey);
    if (cached) return { data: cached, fromCache: true };
    throw new Error('Hors ligne et aucune donnée en cache.');
  }

  try {
    const response = await api.get(url);
    cacheSet(cacheKey, response.data, ttl);
    return { data: response.data, fromCache: false };
  } catch (err) {
    // Erreur réseau → fallback cache
    if (!err.response) {
      const cached = cacheGet(cacheKey);
      if (cached) return { data: cached, fromCache: true };
    }
    throw err;
  }
}

// ══════════════════════════════════════════
// Convenience methods for specific resources
// ══════════════════════════════════════════

export function cacheLecons(api) {
  return fetchWithCache(api, '/lecons/', { ttl: 12 * 60 * 60 * 1000 });
}

export function cacheLeconDetail(api, id) {
  return fetchWithCache(api, `/lecons/${id}/`, { ttl: 12 * 60 * 60 * 1000 });
}

export function cacheMatieres(api) {
  return fetchWithCache(api, '/matieres/', { ttl: 24 * 60 * 60 * 1000 });
}

export function cacheExercices(api, leconId) {
  const url = leconId ? `/exercices/?lecon=${leconId}` : '/exercices/';
  return fetchWithCache(api, url, { ttl: 6 * 60 * 60 * 1000 });
}

export function cacheDashboard(api) {
  return fetchWithCache(api, '/dashboard/', { ttl: 5 * 60 * 1000 }); // 5 min
}

// ══════════════════════════════════════════
// Save pending actions for later sync
// ══════════════════════════════════════════

const PENDING_KEY = 'l1tello_pending_actions';

export function addPendingAction(action) {
  try {
    const pending = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
    pending.push({ ...action, timestamp: Date.now() });
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch { /* silent */ }
}

export function getPendingActions() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearPendingActions() {
  localStorage.removeItem(PENDING_KEY);
}

/**
 * Synchronise les actions en attente quand le réseau revient.
 * @param {AxiosInstance} api
 */
export async function syncPendingActions(api) {
  const pending = getPendingActions();
  if (pending.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;
  const remaining = [];

  for (const action of pending) {
    try {
      if (action.method === 'POST') {
        await api.post(action.url, action.data);
      }
      synced++;
    } catch {
      remaining.push(action);
      failed++;
    }
  }

  if (remaining.length > 0) {
    localStorage.setItem(PENDING_KEY, JSON.stringify(remaining));
  } else {
    clearPendingActions();
  }

  return { synced, failed };
}
