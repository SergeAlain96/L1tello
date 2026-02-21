/**
 * Thème visuel de L1tello Mobile.
 * Palette cohérente avec le frontend web (indigo/slate).
 */

export const COLORS = {
  // ── Fond ──
  bgPrimary: '#0f0d2e',       // Fond principal (sombre)
  bgSecondary: '#1a1745',     // Fond secondaire (cartes)
  bgTertiary: '#252155',      // Fond tertiaire (inputs)
  bgCard: '#1e1b4b',          // Fond de carte

  // ── Accents ──
  primary: '#818cf8',         // Indigo clair (boutons, liens)
  primaryDark: '#6366f1',     // Indigo foncé (hover)
  primaryLight: '#a5b4fc',    // Indigo très clair
  secondary: '#06b6d4',       // Cyan (accents secondaires)
  accent: '#c084fc',          // Violet (badges, highlights)

  // ── Texte ──
  textPrimary: '#f1f5f9',     // Blanc cassé
  textSecondary: '#94a3b8',   // Gris clair
  textMuted: '#64748b',       // Gris moyen
  textInverse: '#0f172a',     // Texte sur fond clair

  // ── Status ──
  success: '#34d399',         // Vert (réussite)
  error: '#f87171',           // Rouge (erreur)
  warning: '#fbbf24',         // Jaune (attention)
  info: '#60a5fa',            // Bleu (info)

  // ── Bordures ──
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.15)',

  // ── Transparences ──
  overlay: 'rgba(0,0,0,0.5)',
  glassBg: 'rgba(255,255,255,0.05)',
};

export const FONTS = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    hero: 36,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
