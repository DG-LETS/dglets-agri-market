/**
 * useThemeColors
 *
 * Drop-in replacement for importing Colors directly.
 * Returns the correct color set based on the current dark/light mode.
 *
 * Usage:
 *   const C = useThemeColors();
 *   <View style={{ backgroundColor: C.background }}>
 */
import { useSettingsStore } from '@store/settingsStore';
import { Colors }           from './colors';
import { DarkColors }       from './darkColors';

export function useThemeColors() {
  const darkMode = useSettingsStore(s => s.darkMode);
  return darkMode ? DarkColors : Colors;
}

/** Same hook but returns both theme + isDark flag */
export function useTheme() {
  const darkMode = useSettingsStore(s => s.darkMode);
  return { C: darkMode ? DarkColors : Colors, isDark: darkMode };
}
