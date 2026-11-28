import { describe, expect, it } from "vitest";
import { AuthRequestError, parseRetryAfter, toAuthErrorKind } from "./auth-error";

describe("toAuthErrorKind", () => {
  it.each([
    [401, "INVALID_EMAIL_OR_PASSWORD", "invalidCredentials"],
    [422, "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL", "emailTaken"],
    [400, "PASSWORD_TOO_SHORT", "passwordTooShort"],
    [400, "PASSWORD_TOO_LONG", "passwordTooLong"],
    [401, "INVALID_CODE", "invalidCode"],
    [401, "INVALID_BACKUP_CODE", "invalidRecoveryCode"],
    [400, "OTP_HAS_EXPIRED", "emailCodeExpired"],
    [400, "TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE", "tooManyCodeAttempts"],
    [401, "INVALID_TWO_FACTOR_COOKIE", "twoFactorExpired"],
    [400, "INVALID_TOKEN", "invalidToken"],
  ])("maps %i %s to %s", (status, code, type) => {
    expect(toAuthErrorKind({ status, code })).toEqual({ type });
  });

  it("maps the account lockout before the generic 429", () => {
    expect(toAuthErrorKind({ status: 429, code: "ACCOUNT_TEMPORARILY_LOCKED" })).toEqual({ type: "accountLocked" });
  });

  it("maps a rate limit with the delay given by the server", () => {
    expect(toAuthErrorKind({ status: 429 }, "17")).toEqual({ type: "rateLimited", retryAfterSeconds: 17 });
  });

  it("keeps a rate limit without a usable delay", () => {
    expect(toAuthErrorKind({ status: 429 }, null)).toEqual({ type: "rateLimited", retryAfterSeconds: null });
  });

  it("treats anything else as unknown", () => {
    expect(toAuthErrorKind({ status: 500, code: "FAILED_TO_CREATE_SESSION" })).toEqual({ type: "unknown" });
    expect(toAuthErrorKind({ status: 400 })).toEqual({ type: "unknown" });
  });
});

describe("parseRetryAfter", () => {
  it("reads whole seconds", () => {
    expect(parseRetryAfter("30")).toBe(30);
  });

  it("rounds partial seconds up so the user never retries too early", () => {
    expect(parseRetryAfter("2.1")).toBe(3);
  });

  it("returns null for missing, negative, zero or non-numeric values", () => {
    expect(parseRetryAfter(null)).toBeNull();
    expect(parseRetryAfter(undefined)).toBeNull();
    expect(parseRetryAfter("")).toBeNull();
    expect(parseRetryAfter("-5")).toBeNull();
    expect(parseRetryAfter("0")).toBeNull();
    expect(parseRetryAfter("soon")).toBeNull();
  });
});

describe("AuthRequestError", () => {
  it("carries the error kind and never the server message", () => {
    const error = new AuthRequestError({ type: "invalidCode" });
    expect(error).toBeInstanceOf(Error);
    expect(error.kind).toEqual({ type: "invalidCode" });
    expect(error.message).toBe("invalidCode");
  });
});
