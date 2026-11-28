type SimpleAuthErrorType =
  | "invalidCredentials"
  | "emailTaken"
  | "passwordTooShort"
  | "passwordTooLong"
  | "invalidCode"
  | "invalidRecoveryCode"
  | "emailCodeExpired"
  | "tooManyCodeAttempts"
  | "accountLocked"
  | "twoFactorExpired"
  | "invalidToken"
  | "unknown";

export type AuthErrorKind =
  | { type: SimpleAuthErrorType }
  | { type: "rateLimited"; retryAfterSeconds: number | null };

export type AuthErrorType = AuthErrorKind["type"];

/** Error shape returned by Better-Auth: `{ error: { status, code, message } }`. */
export interface AuthApiError {
  status: number;
  code?: string;
}

const ERROR_TYPE_BY_CODE = new Map<string, SimpleAuthErrorType>([
  ["INVALID_EMAIL_OR_PASSWORD", "invalidCredentials"],
  ["USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL", "emailTaken"],
  ["PASSWORD_TOO_SHORT", "passwordTooShort"],
  ["PASSWORD_TOO_LONG", "passwordTooLong"],
  ["INVALID_CODE", "invalidCode"],
  ["INVALID_BACKUP_CODE", "invalidRecoveryCode"],
  ["OTP_HAS_EXPIRED", "emailCodeExpired"],
  ["TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE", "tooManyCodeAttempts"],
  // A 429 too, but from the account lockout, without X-Retry-After: must win over the generic rate limit.
  ["ACCOUNT_TEMPORARILY_LOCKED", "accountLocked"],
  ["INVALID_TWO_FACTOR_COOKIE", "twoFactorExpired"],
  ["INVALID_TOKEN", "invalidToken"],
]);

const TOO_MANY_REQUESTS = 429;

/** Seconds to wait from an `X-Retry-After` header, rounded up; `null` when absent or unusable. */
export const parseRetryAfter = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : null;
};

export const toAuthErrorKind = ({ status, code }: AuthApiError, retryAfter?: string | null): AuthErrorKind => {
  const type = code ? ERROR_TYPE_BY_CODE.get(code) : undefined;
  if (type) return { type };
  if (status === TOO_MANY_REQUESTS) return { type: "rateLimited", retryAfterSeconds: parseRetryAfter(retryAfter) };
  return { type: "unknown" };
};

/** Thrown by the auth hooks. Carries a normalized kind only: the server message is never surfaced. */
export class AuthRequestError extends Error {
  readonly kind: AuthErrorKind;

  constructor(kind: AuthErrorKind) {
    super(kind.type);
    this.name = "AuthRequestError";
    this.kind = kind;
  }
}
