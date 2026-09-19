import { useSettingsStore } from '@store/settingsStore';
import { Colors } from '@theme/colors';

/* Returns a theme object that switches between light and dark colors */
export function useTheme() {
  const darkMode = useSettingsStore(s => s.darkMode);

  const theme = {
    dark: darkMode,

    /* Backgrounds */
    background:  darkMode ? '#0f1a14' : Colors.background,
    surface:     darkMode ? '#1a2d20' : Colors.white,
    card:        darkMode ? '#1e3526' : Colors.white,

    /* Text */
    text:        darkMode ? '#f0f7f1' : Colors.textPrimary,
    textSecondary: darkMode ? '#a3c9a8' : Colors.textSecondary,
    textMuted:   darkMode ? '#6b9971' : Colors.textMuted,

    /* Brand */
    primary:     Colors.green[700],
    primaryLight: darkMode ? '#2d7a4f' : Colors.green[100],

    /* Borders */
    border:      darkMode ? '#2d4a35' : Colors.border,

    /* Nav bar */
    navBackground: darkMode ? '#0f1a14' : Colors.white,
    navBorder:     darkMode ? '#1e3526' : Colors.border,

    /* Tab bar */
    tabBackground: darkMode ? '#111f16' : Colors.white,
    tabActive:     Colors.green[700],
    tabInactive:   darkMode ? '#4a7a52' : Colors.gray[400],

    /* Header */
    headerBg:    Colors.green[700],
    headerText:  Colors.white,

    /* Input */
    inputBg:       darkMode ? '#1a2d20' : Colors.gray[50],
    inputBorder:   darkMode ? '#2d4a35' : Colors.border,
    inputText:     darkMode ? '#f0f7f1' : Colors.textPrimary,
    inputPlaceholder: darkMode ? '#4a7a52' : Colors.gray[400],
  };

  return theme;
}
