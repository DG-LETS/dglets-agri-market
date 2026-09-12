/**
 * DG-LETS Agri Market — Color System
 * Matches the brand palette from the UI/UX reference
 */
export const Colors = {
  /* ── Primary green palette ── */
  green: {
    900: '#0f2d1a',
    800: '#1b4332',
    700: '#1e5c3a',
    600: '#2d7a4f',
    500: '#40916c',
    400: '#52b788',
    300: '#74c69d',
    200: '#b7e4c7',
    100: '#d8f3dc',
    50:  '#f0f7f1',
  },

  /* ── Gold / accent ── */
  gold: {
    700: '#a47000',
    600: '#c8960c',
    500: '#d4a017',
    400: '#f4c430',
    100: '#fef6e0',
    50:  '#fffbf0',
  },

  /* ── WhatsApp green ── */
  whatsapp: '#25d366',

  /* ── Neutrals ── */
  gray: {
    900: '#111827',
    800: '#1f2937',
    700: '#374151',
    600: '#4b5563',
    500: '#6b7280',
    400: '#9ca3af',
    300: '#d1d5db',
    200: '#e5e7eb',
    100: '#f3f4f6',
    50:  '#f9fafb',
  },

  /* ── Semantic ── */
  success: '#22c55e',
  successLight: '#dcfce7',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  error:   '#ef4444',
  errorLight: '#fee2e2',
  info:    '#3b82f6',
  infoLight: '#dbeafe',

  /* ── Base ── */
  white:       '#ffffff',
  black:       '#000000',
  transparent: 'transparent',

  /* ── Background ── */
  background:     '#f9fafb',
  backgroundGreen: '#f0f7f1',
  surface:        '#ffffff',

  /* ── Text ── */
  textPrimary:   '#111827',
  textSecondary: '#374151',
  textMuted:     '#6b7280',
  textDisabled:  '#9ca3af',
  textInverse:   '#ffffff',

  /* ── Border ── */
  border:       '#e5e7eb',
  borderFocus:  '#2d7a4f',
  borderError:  '#ef4444',

  /* ── Status badges ── */
  statusPending:    { bg: '#fef3c7', text: '#92400e' },
  statusActive:     { bg: '#dcfce7', text: '#14532d' },
  statusInProgress: { bg: '#dbeafe', text: '#1e3a8a' },
  statusCompleted:  { bg: '#d8f3dc', text: '#1b4332' },
  statusCancelled:  { bg: '#fee2e2', text: '#991b1b' },
  statusVerified:   { bg: '#d8f3dc', text: '#1b4332' },
} as const;
