// === Custom Errors ===
export class InviteError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'InviteError';
  }
}

export class TokenError extends InviteError {
  constructor(message: string = 'Invalid or expired invitation token') {
    super(message, 'TOKEN_ERROR');
  }
}

export class InviteNotFoundError extends InviteError {
  constructor(message: string = 'Invitation not found') {
    super(message, 'INVITE_NOT_FOUND');
  }
}
