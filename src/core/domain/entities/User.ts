export type UserId = string;

export type User = {
  id: UserId;
  username: string;
  name?: string;
  role?: 'admin' | 'user';
  isActive: boolean;
  passwordHash?: string; // opcional, solo en contextos donde sea necesario
};

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}
