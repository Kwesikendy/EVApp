// theme.ts — ChargeLink GH Design Tokens
// Brand: ChargeLink GH | "Powering a Cleaner Tomorrow"
// Primary: ChargeLink Green (#22c55e) on Deep Obsidian (#10141a)
export const Theme = {
  colors: {
    background: '#10141a',
    surface: '#181c22',
    surfaceBright: '#1a2818',   // Subtle green-tinted surface for brand warmth
    surfaceContainerLowest: '#0a0e14',
    border: '#2a313d',
    primary: '#22c55e',          // ChargeLink Green (was Electric Cyan #00f0ff)
    primaryLight: '#4ade80',     // Light green for highlights
    primaryPressed: '#16a34a',   // Pressed/active state (deeper green)
    onPrimary: '#000000',
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    success: '#00e676',
    error: '#ff4d4d',
    warning: '#f59e0b',
    underConstruction: '#f59e0b', // Amber for under-construction station status
  },
  typography: {
    fontFamily: undefined,
    fontBold: undefined,
    fontMedium: undefined,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    full: 9999,
  },
};
