import { Platform } from 'react-native';

export const FontFamily = {
  regular:     Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
  medium:      Platform.select({ ios: 'System', android: 'Roboto-Medium', default: 'System' }),
  semiBold:    Platform.select({ ios: 'System', android: 'Roboto-Medium', default: 'System' }),
  bold:        Platform.select({ ios: 'System', android: 'Roboto-Bold', default: 'System' }),
  extraBold:   Platform.select({ ios: 'System', android: 'Roboto-Bold', default: 'System' }),
} as const;

export const FontSize = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   16,
  lg:   18,
  xl:   20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
} as const;

export const LineHeight = {
  tight:  1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export const Typography = {
  displayLarge:  { fontSize: FontSize['4xl'], fontWeight: '900' as const, lineHeight: FontSize['4xl'] * 1.2 },
  displayMedium: { fontSize: FontSize['3xl'], fontWeight: '800' as const, lineHeight: FontSize['3xl'] * 1.25 },
  displaySmall:  { fontSize: FontSize['2xl'], fontWeight: '800' as const, lineHeight: FontSize['2xl'] * 1.25 },
  headingLarge:  { fontSize: FontSize['2xl'], fontWeight: '800' as const, lineHeight: FontSize['2xl'] * 1.25 },
  headingMedium: { fontSize: FontSize.xl,     fontWeight: '700' as const, lineHeight: FontSize.xl * 1.3 },
  headingSmall:  { fontSize: FontSize.lg,     fontWeight: '700' as const, lineHeight: FontSize.lg * 1.3 },
  titleLarge:    { fontSize: FontSize.md,     fontWeight: '700' as const, lineHeight: FontSize.md * 1.4 },
  titleMedium:   { fontSize: FontSize.base,   fontWeight: '600' as const, lineHeight: FontSize.base * 1.4 },
  bodyLarge:     { fontSize: FontSize.base,   fontWeight: '400' as const, lineHeight: FontSize.base * 1.6 },
  bodyMedium:    { fontSize: FontSize.sm,     fontWeight: '400' as const, lineHeight: FontSize.sm * 1.6 },
  bodySmall:     { fontSize: FontSize.xs,     fontWeight: '400' as const, lineHeight: FontSize.xs * 1.6 },
  labelLarge:    { fontSize: FontSize.sm,     fontWeight: '600' as const, lineHeight: FontSize.sm * 1.3 },
  labelMedium:   { fontSize: FontSize.xs,     fontWeight: '600' as const, lineHeight: FontSize.xs * 1.3 },
  caption:       { fontSize: 10,              fontWeight: '400' as const, lineHeight: 14 },
} as const;
