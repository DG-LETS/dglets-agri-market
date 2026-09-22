/**
 * DG-LETS — Dark Mode Color Overrides
 * These values replace the light Colors when darkMode is true.
 */
export const DarkColors = {
  /* Greens stay on-brand */
  green: {
    900: '#0f2d1a',
    800: '#1b4332',
    700: '#1e5c3a',
    600: '#2d7a4f',
    500: '#40916c',
    400: '#52b788',
    300: '#74c69d',
    200: '#b7e4c7',
    100: '#1e3526',
    50:  '#172b1d',
  },
  gold: {
    700: '#a47000',
    600: '#c8960c',
    500: '#d4a017',
    400: '#f4c430',
    100: '#2a2200',
    50:  '#1a1500',
  },
  whatsapp: '#25d366',
  gray: {
    900: '#f0f7f1',
    800: '#d1e8d6',
    700: '#a3c9a8',
    600: '#6b9971',
    500: '#4a7a52',
    400: '#3a5e40',
    300: '#2d4a35',
    200: '#1e3526',
    100: '#172b1d',
    50:  '#111f16',
  },
  success:      '#22c55e',
  successLight: '#1a3d1e',
  warning:      '#f59e0b',
  warningLight: '#2a1f00',
  error:        '#ef4444',
  errorLight:   '#3d1010',
  info:         '#60a5fa',
  infoLight:    '#0d1f3d',

  white:       '#1a2d20',
  black:       '#f0f7f1',
  transparent: 'transparent',

  background:      '#0f1a14',
  backgroundGreen: '#111f16',
  surface:         '#1a2d20',

  textPrimary:   '#f0f7f1',
  textSecondary: '#a3c9a8',
  textMuted:     '#6b9971',
  textDisabled:  '#3a5e40',
  textInverse:   '#111827',

  border:      '#2d4a35',
  borderFocus: '#52b788',
  borderError: '#ef4444',

  statusPending:    { bg: '#2a1f00', text: '#f59e0b' },
  statusActive:     { bg: '#1a3d1e', text: '#52b788' },
  statusInProgress: { bg: '#0d1f3d', text: '#60a5fa' },
  statusCompleted:  { bg: '#1a3d1e', text: '#52b788' },
  statusCancelled:  { bg: '#3d1010', text: '#ef4444' },
  statusVerified:   { bg: '#1a3d1e', text: '#52b788' },
} as const;
