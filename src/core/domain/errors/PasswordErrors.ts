export class PasswordChangeError extends Error {
  constructor(
    message: string,
    public readonly code: 'INVALID_CURRENT' | 'USER_NOT_FOUND' | 'WEAK_PASSWORD' | 'GENERIC',
  ) {
    super(message);
    this.name = 'PasswordChangeError';
  }
}
