/**
 * Client-side auth helpers that call the BFF proxy API routes.
 * All mutating requests include the CSRF header.
 * The token is managed server-side via httpOnly cookies — never exposed to JS.
 */

const CONNECTION_ID = process.env.NEXT_PUBLIC_BRAINERCE_CONNECTION_ID || '';

const CSRF_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'X-Requested-With': 'brainerce',
};

interface LoginResult {
  customer: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    emailVerified: boolean;
  };
  expiresAt: string;
  requiresVerification?: boolean;
}

interface RegisterResult {
  customer: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    emailVerified: boolean;
  };
  expiresAt: string;
  requiresVerification?: boolean;
}

interface AuthStatus {
  isLoggedIn: boolean;
  customer?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    emailVerified: boolean;
  };
  error?: string;
}

interface VerifyEmailResult {
  verified: boolean;
  message?: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || `Request failed (${response.status})`);
  }
  return data as T;
}

/**
 * Login via BFF proxy. The proxy sets the httpOnly cookie on success.
 */
export async function proxyLogin(email: string, password: string): Promise<LoginResult> {
  const response = await fetch(`/api/store/api/vc/${CONNECTION_ID}/customers/login`, {
    method: 'POST',
    headers: CSRF_HEADERS,
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<LoginResult>(response);
}

/**
 * Register via BFF proxy. The proxy sets the httpOnly cookie on success.
 */
export async function proxyRegister(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  acceptsMarketing?: boolean;
}): Promise<RegisterResult> {
  const response = await fetch(`/api/store/api/vc/${CONNECTION_ID}/customers/register`, {
    method: 'POST',
    headers: CSRF_HEADERS,
    body: JSON.stringify(data),
  });
  return handleResponse<RegisterResult>(response);
}

/**
 * Check auth status. Reads httpOnly cookie server-side and validates with backend.
 */
export async function checkAuthStatus(): Promise<AuthStatus> {
  const response = await fetch('/api/auth/me');
  return response.json();
}

/**
 * Logout. Clears httpOnly auth cookies server-side.
 */
export async function proxyLogout(): Promise<void> {
  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: { 'X-Requested-With': 'brainerce' },
  });
}

/**
 * Verify email via BFF proxy. The auth token is in the httpOnly cookie (set during login/register).
 * The proxy adds the Authorization header automatically.
 */
export async function proxyVerifyEmail(code: string): Promise<VerifyEmailResult> {
  const response = await fetch(`/api/store/api/vc/${CONNECTION_ID}/customers/verify-email`, {
    method: 'POST',
    headers: CSRF_HEADERS,
    body: JSON.stringify({ code }),
  });
  return handleResponse<VerifyEmailResult>(response);
}

/**
 * Resend verification email via BFF proxy.
 * Uses the auth token from the httpOnly cookie.
 */
export async function proxyResendVerification(): Promise<{ message: string }> {
  const response = await fetch(`/api/store/api/vc/${CONNECTION_ID}/customers/resend-verification`, {
    method: 'POST',
    headers: CSRF_HEADERS,
  });
  return handleResponse<{ message: string }>(response);
}

/**
 * Reset password via BFF proxy.
 * The reset token is in an httpOnly cookie (set by /api/auth/reset-callback when the user
 * clicked the email link). The proxy reads it server-side — the token never reaches client JS.
 */
export async function proxyResetPassword(newPassword: string): Promise<{ message: string }> {
  const response = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: CSRF_HEADERS,
    body: JSON.stringify({ newPassword }),
  });
  return handleResponse<{ message: string }>(response);
}
