import { describe, expect, it } from "vitest";
import type { z } from "zod";
import {
  forgotPasswordSchema,
  isValidationMessageKey,
  recoveryCodeSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "./schemas";

const issuesOf = (result: z.ZodSafeParseResult<unknown>) =>
  result.success ? [] : result.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }));

describe("signInSchema", () => {
  it("accepts an email and any non-empty password, trimming the email", () => {
    const result = signInSchema.safeParse({ email: "  none@example.com ", password: "x" });
    expect(result.success && result.data).toEqual({ email: "none@example.com", password: "x" });
  });

  it("does not enforce the password policy at sign-in", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "short" }).success).toBe(true);
  });

  it("reports a missing email and password", () => {
    expect(issuesOf(signInSchema.safeParse({ email: "", password: "" }))).toEqual([
      { path: "email", message: "emailRequired" },
      { path: "password", message: "passwordRequired" },
    ]);
  });

  it("reports an invalid email", () => {
    expect(issuesOf(signInSchema.safeParse({ email: "not-an-email", password: "x" }))).toEqual([
      { path: "email", message: "emailInvalid" },
    ]);
  });
});

describe("signUpSchema", () => {
  const valid = { email: "new@example.com", password: "12345678", confirmPassword: "12345678" };

  it("accepts matching passwords of 8 to 128 characters", () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true);
    const longest = "a".repeat(128);
    expect(signUpSchema.safeParse({ ...valid, password: longest, confirmPassword: longest }).success).toBe(true);
  });

  it("rejects passwords shorter than 8 or longer than 128 characters", () => {
    expect(issuesOf(signUpSchema.safeParse({ ...valid, password: "1234567", confirmPassword: "1234567" }))).toEqual([
      { path: "password", message: "passwordTooShort" },
    ]);
    const tooLong = "a".repeat(129);
    expect(issuesOf(signUpSchema.safeParse({ ...valid, password: tooLong, confirmPassword: tooLong }))).toEqual([
      { path: "password", message: "passwordTooLong" },
    ]);
  });

  it("reports a missing confirmation", () => {
    expect(issuesOf(signUpSchema.safeParse({ ...valid, confirmPassword: "" }))).toEqual([
      { path: "confirmPassword", message: "passwordConfirmationRequired" },
    ]);
  });

  it("reports a confirmation that does not match, on the confirmation field", () => {
    expect(issuesOf(signUpSchema.safeParse({ ...valid, confirmPassword: "87654321" }))).toEqual([
      { path: "confirmPassword", message: "passwordsDoNotMatch" },
    ]);
  });

  it("does not report a mismatch while the confirmation is still empty", () => {
    expect(issuesOf(signUpSchema.safeParse({ ...valid, password: "1", confirmPassword: "" }))).toEqual([
      { path: "password", message: "passwordTooShort" },
      { path: "confirmPassword", message: "passwordConfirmationRequired" },
    ]);
  });

  it("reports the mismatch even while the email is still invalid", () => {
    expect(issuesOf(signUpSchema.safeParse({ ...valid, email: "nope", confirmPassword: "87654321" }))).toEqual([
      { path: "email", message: "emailInvalid" },
      { path: "confirmPassword", message: "passwordsDoNotMatch" },
    ]);
  });
});

describe("forgotPasswordSchema", () => {
  it("validates the email only", () => {
    expect(forgotPasswordSchema.safeParse({ email: " a@b.co " }).success).toBe(true);
    expect(issuesOf(forgotPasswordSchema.safeParse({ email: "nope" }))).toEqual([
      { path: "email", message: "emailInvalid" },
    ]);
  });
});

describe("resetPasswordSchema", () => {
  it("applies the same password rules as sign-up", () => {
    expect(resetPasswordSchema.safeParse({ newPassword: "12345678", confirmPassword: "12345678" }).success).toBe(true);
    expect(issuesOf(resetPasswordSchema.safeParse({ newPassword: "123", confirmPassword: "123" }))).toEqual([
      { path: "newPassword", message: "passwordTooShort" },
    ]);
    expect(issuesOf(resetPasswordSchema.safeParse({ newPassword: "12345678", confirmPassword: "x" }))).toEqual([
      { path: "confirmPassword", message: "passwordsDoNotMatch" },
    ]);
  });
});

describe("recoveryCodeSchema", () => {
  it("accepts the server format and keeps its case", () => {
    const result = recoveryCodeSchema.safeParse({ code: "pxrrI-ddMGt" });
    expect(result.success && result.data.code).toBe("pxrrI-ddMGt");
  });

  it("trims and adds the dash when it was left out", () => {
    const result = recoveryCodeSchema.safeParse({ code: "  pxrrIddMGt " });
    expect(result.success && result.data.code).toBe("pxrrI-ddMGt");
  });

  it("reports a missing or malformed code", () => {
    expect(issuesOf(recoveryCodeSchema.safeParse({ code: " " }))).toEqual([
      { path: "code", message: "recoveryCodeRequired" },
    ]);
    expect(issuesOf(recoveryCodeSchema.safeParse({ code: "12345" }))).toEqual([
      { path: "code", message: "recoveryCodeInvalid" },
    ]);
  });
});

describe("isValidationMessageKey", () => {
  it("recognizes the keys emitted by the schemas only", () => {
    expect(isValidationMessageKey("passwordsDoNotMatch")).toBe(true);
    expect(isValidationMessageKey("Invalid input")).toBe(false);
  });
});
