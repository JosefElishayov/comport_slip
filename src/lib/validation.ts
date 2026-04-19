const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 254) return false;
  return EMAIL_REGEX.test(email);
}

export type PasswordErrorCode =
  | 'passwordRequired'
  | 'passwordTooShort'
  | 'passwordNoUppercase'
  | 'passwordNoNumber'
  | 'passwordNoSymbol';

export function getPasswordError(password: string): PasswordErrorCode | null {
  if (!password || typeof password !== 'string') return 'passwordRequired';
  if (password.length < 8) return 'passwordTooShort';
  if (!/[A-Z]/.test(password)) return 'passwordNoUppercase';
  if (!/[0-9]/.test(password)) return 'passwordNoNumber';
  if (!/[^A-Za-z0-9]/.test(password)) return 'passwordNoSymbol';
  return null;
}

const PASSWORD_ERROR_MESSAGES: Record<PasswordErrorCode, string> = {
  passwordRequired: 'Password is required',
  passwordTooShort: 'Password must be at least 8 characters',
  passwordNoUppercase: 'Password must contain at least one uppercase letter',
  passwordNoNumber: 'Password must contain at least one number',
  passwordNoSymbol: 'Password must contain at least one special character',
};

export function validatePassword(password: string): string | null {
  const code = getPasswordError(password);
  return code ? PASSWORD_ERROR_MESSAGES[code] : null;
}
