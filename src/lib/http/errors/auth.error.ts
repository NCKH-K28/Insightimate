export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

export class EmailAlreadyExistsError extends AuthError {
  constructor(message = 'Email already exists') {
    super(message);
    this.name = 'EmailAlreadyExistsError';
    Object.setPrototypeOf(this, EmailAlreadyExistsError.prototype);
  }
}

export class UserNotFoundError extends AuthError {
  constructor(message = 'User not found') {
    super(message);
    this.name = 'UserNotFoundError';
    Object.setPrototypeOf(this, UserNotFoundError.prototype);
  }
}

export class InvalidCredentialsError extends AuthError {
  constructor(message = 'Invalid credentials') {
    super(message);
    this.name = 'InvalidCredentialsError';
    Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
  }
}

export class UnauthorizedError extends AuthError {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends AuthError {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export type AuthErrorType =
  | EmailAlreadyExistsError
  | InvalidCredentialsError
  | UserNotFoundError
  | UnauthorizedError;
