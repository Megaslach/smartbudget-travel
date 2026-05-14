// Itinifly dark theme — inspired by the official mockup design
// Dark navy background + warm orange accent

export const colors = {
  // Backgrounds (dark theme)
  bg: '#0E1424',          // main app background — deep navy
  bgElevated: '#19223A',  // cards, tab bar, modals
  bgSubtle: '#222B47',    // subtle hover/pressed
  bgOverlay: 'rgba(0,0,0,0.55)',

  // Brand orange accent
  primary: {
    50:  '#FFF1EA',
    100: '#FFE0D0',
    200: '#FFC09F',
    300: '#FF9D6A',
    400: '#FF7A3A',
    500: '#FF5A1F',  // main accent
    600: '#E64910',
    700: '#B5360A',
    800: '#7A2407',
    900: '#3F1304',
  },

  // Accent (alias for compatibility with old code)
  accent: {
    50:  '#FFF1EA',
    100: '#FFE0D0',
    200: '#FFC09F',
    300: '#FF9D6A',
    400: '#FF7A3A',
    500: '#FF5A1F',
    600: '#E64910',
    700: '#B5360A',
    800: '#7A2407',
    900: '#3F1304',
  },

  // Sand (legacy — keep neutral grays mapped to dark theme)
  sand: {
    50:  '#0E1424',
    100: '#19223A',
    200: '#222B47',
    300: '#2D3855',
    400: '#3D4A6E',
    500: '#56648B',
    600: '#8492B7',
    700: '#B7C0D8',
    800: '#DCE2EE',
    900: '#F4F6FB',
  },

  // Gray scale — INVERTED for dark theme.
  // Legacy code uses gray[900] for primary text and gray[50] for backgrounds —
  // those mappings must still produce readable contrast on a dark background.
  // Lower index = darker (use as bg / borders), higher index = lighter (use as text).
  gray: {
    50:  '#0E1424',  // darkest — page bg
    100: '#19223A',  // elevated bg
    200: '#222B47',  // borders / dividers
    300: '#2D3855',
    400: '#3D4A6E',  // muted text
    500: '#56648B',  // tertiary text
    600: '#8492B7',  // muted/secondary text
    700: '#B7C0D8',  // secondary text
    800: '#DCE2EE',  // primary-ish text
    900: '#F4F6FB',  // primary text (lightest)
  },

  // Text (semantic)
  text: {
    primary:   '#FFFFFF',
    secondary: '#B7C0D8',
    muted:     '#8492B7',
    inverse:   '#0E1424',
  },

  // Borders
  border:       'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.15)',

  white: '#FFFFFF',
  red:     { 400: '#FF6B6B', 500: '#FF5252', 600: '#E53935' },
  emerald: { 400: '#4ECDA0', 500: '#3DBD8C', 600: '#2DA078' },
  amber:   { 100: '#3A2C18', 400: '#FFB74D', 500: '#FFA726' },
  sky:     { 100: '#1A2C3F', 500: '#5BB6FF', 600: '#3D9FE8' },
  indigo:  { 100: '#1F1F3F', 500: '#7C7CFF', 600: '#5D5DDB' },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 19,
  '2xl': 22,
  '3xl': 28,
  '4xl': 34,
  '5xl': 42,
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 4,
  },
  glow: {
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
};
