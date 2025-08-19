// Central theme constants for TS usage (no runtime side-effects)
export const colors = {
  brand: '#ff6600',
  ink: '#444f62',
  background: '#ffffff',
  foreground: '#171717',
} as const;

export type ColorKeys = keyof typeof colors;
