// Central theme constants for TS usage (no runtime side-effects)
export const colors = {
  brand: '#ff6600',
  ink: '#444f62',
  background: '#ffffff',
  foreground: '#171717',
  // neutrals (non-brand) to tune dark/light surfaces without altering brand tokens
  neutralBgDark: '#0a0a0a',
  neutralCardDark: '#0f172a',
  neutralBorderDark: '#334155',
  neutralInputDark: '#0b0f1a',
  neutralPlaceholderDark: '#94a3b8',
} as const;

export type ColorKeys = keyof typeof colors;
