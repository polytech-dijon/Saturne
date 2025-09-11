import { CredentialsSignin } from 'next-auth';

export class UsernameError extends CredentialsSignin {
  constructor(message: string) {
    super(message);
    this.message = message;
  }
}

export class PasswordError extends CredentialsSignin {
  constructor(message: string) {
    super(message);
    this.message = message;
  }
}
