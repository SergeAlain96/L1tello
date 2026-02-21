/**
 * Utilitaires de sécurité côté client.
 *
 * Protège contre :
 *  - XSS dans les inputs utilisateur
 *  - Injections dans les données envoyées à l'API
 */

const SCRIPT_PATTERN = /<script\b[^>]*>[\s\S]*?<\/script\b[^>]*>/gi;
const HTML_TAG_PATTERN = /<\/?[^>]+(>|$)/g;
const EVENT_HANDLER_PATTERN = /\bon\w+\s*=/gi;
const JS_URI_PATTERN = /javascript\s*:/gi;

/**
 * Supprime les balises HTML et les patterns dangereux d'une chaîne.
 */
export function sanitizeInput(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(SCRIPT_PATTERN, '')
    .replace(EVENT_HANDLER_PATTERN, '')
    .replace(JS_URI_PATTERN, '')
    .replace(HTML_TAG_PATTERN, '')
    .trim();
}

/**
 * Sanitize un objet récursivement.
 */
export function sanitizeObject(obj) {
  if (typeof obj === 'string') return sanitizeInput(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (obj && typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[sanitizeInput(key)] = sanitizeObject(value);
    }
    return result;
  }
  return obj;
}

/**
 * Vérifie si un texte contient du contenu potentiellement dangereux.
 */
export function containsXSS(value) {
  if (typeof value !== 'string') return false;
  // Reset lastIndex to avoid the global regex stateful .test() bug
  SCRIPT_PATTERN.lastIndex = 0;
  EVENT_HANDLER_PATTERN.lastIndex = 0;
  JS_URI_PATTERN.lastIndex = 0;
  return (
    SCRIPT_PATTERN.test(value) ||
    EVENT_HANDLER_PATTERN.test(value) ||
    JS_URI_PATTERN.test(value)
  );
}

/**
 * Valide un email.
 */
export function isValidEmail(email) {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

/**
 * Valide un nom d'utilisateur (3-50 chars, alphanumérique).
 */
export function isValidUsername(username) {
  return /^[a-zA-Z0-9_@.+-]{3,50}$/.test(username);
}
