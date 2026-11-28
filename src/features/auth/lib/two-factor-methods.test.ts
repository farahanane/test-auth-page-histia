import { describe, expect, it } from "vitest";
import {
  getTwoFactorMode,
  getVerifiers,
  parseTwoFactorMethods,
  serializeTwoFactorMethods,
  shouldTryNextVerifier,
} from "./two-factor-methods";

describe("parseTwoFactorMethods", () => {
  it("reads the methods kept in the URL", () => {
    expect(parseTwoFactorMethods("totp")).toEqual(["totp"]);
    expect(parseTwoFactorMethods("otp")).toEqual(["otp"]);
    expect(parseTwoFactorMethods("totp,otp")).toEqual(["totp", "otp"]);
  });

  it("normalizes order and duplicates", () => {
    expect(parseTwoFactorMethods("otp,totp")).toEqual(["totp", "otp"]);
    expect(parseTwoFactorMethods("otp,otp")).toEqual(["otp"]);
  });

  it("rejects missing, empty or unknown values", () => {
    expect(parseTwoFactorMethods(null)).toBeNull();
    expect(parseTwoFactorMethods(undefined)).toBeNull();
    expect(parseTwoFactorMethods("")).toBeNull();
    expect(parseTwoFactorMethods("sms")).toBeNull();
    expect(parseTwoFactorMethods("totp,sms")).toBeNull();
  });

  it("round-trips with serializeTwoFactorMethods", () => {
    expect(serializeTwoFactorMethods(["otp", "totp"])).toBe("totp,otp");
    expect(parseTwoFactorMethods(serializeTwoFactorMethods(["otp"]))).toEqual(["otp"]);
  });
});

describe("getTwoFactorMode", () => {
  it("maps the account methods to the screen variant", () => {
    expect(getTwoFactorMode(["totp"])).toBe("app");
    expect(getTwoFactorMode(["otp"])).toBe("email");
    expect(getTwoFactorMode(["totp", "otp"])).toBe("appAndEmail");
  });
});

describe("getVerifiers", () => {
  it("uses the app code only for app accounts", () => {
    expect(getVerifiers("app", { emailCodeSent: false })).toEqual(["totp"]);
  });

  it("uses the email code only for email accounts", () => {
    expect(getVerifiers("email", { emailCodeSent: true })).toEqual(["otp"]);
  });

  it("uses the app code until an email code is requested (app + email)", () => {
    expect(getVerifiers("appAndEmail", { emailCodeSent: false })).toEqual(["totp"]);
  });

  it("tries the email code then the app code once an email code is sent (app + email)", () => {
    expect(getVerifiers("appAndEmail", { emailCodeSent: true })).toEqual(["otp", "totp"]);
  });
});

describe("shouldTryNextVerifier", () => {
  it("falls back when the code is wrong or the email code expired", () => {
    expect(shouldTryNextVerifier({ type: "invalidCode" })).toBe(true);
    expect(shouldTryNextVerifier({ type: "emailCodeExpired" })).toBe(true);
  });

  it("falls back when the email code ran out of attempts, so a valid app code still works", () => {
    expect(shouldTryNextVerifier({ type: "tooManyCodeAttempts" })).toBe(true);
  });

  it("stops on any other error", () => {
    expect(shouldTryNextVerifier({ type: "twoFactorExpired" })).toBe(false);
    expect(shouldTryNextVerifier({ type: "accountLocked" })).toBe(false);
    expect(shouldTryNextVerifier({ type: "rateLimited", retryAfterSeconds: 10 })).toBe(false);
    expect(shouldTryNextVerifier({ type: "unknown" })).toBe(false);
  });
});
