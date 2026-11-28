import type { AuthErrorKind } from "./auth-error";

/** Methods returned by sign-in in `twoFactorMethods`: "totp" = authenticator app, "otp" = email code. */
export const TWO_FACTOR_METHODS = ["totp", "otp"] as const;

export type TwoFactorMethod = (typeof TWO_FACTOR_METHODS)[number];

export type TwoFactorMode = "app" | "email" | "appAndEmail";

const isTwoFactorMethod = (value: string): value is TwoFactorMethod =>
  TWO_FACTOR_METHODS.some((method) => method === value);

const normalize = (methods: readonly TwoFactorMethod[]): TwoFactorMethod[] =>
  TWO_FACTOR_METHODS.filter((method) => methods.includes(method));

/** Reads the methods kept in the URL; `null` when missing or not a valid list. */
export const parseTwoFactorMethods = (raw: string | null | undefined): TwoFactorMethod[] | null => {
  if (!raw) return null;
  const values = raw.split(",");
  if (!values.every(isTwoFactorMethod)) return null;
  const methods = normalize(values);
  return methods.length > 0 ? methods : null;
};

export const serializeTwoFactorMethods = (methods: readonly TwoFactorMethod[]): string => normalize(methods).join(",");

export const getTwoFactorMode = (methods: readonly TwoFactorMethod[]): TwoFactorMode => {
  const hasApp = methods.includes("totp");
  const hasEmail = methods.includes("otp");
  if (hasApp && hasEmail) return "appAndEmail";
  return hasEmail ? "email" : "app";
};

/**
 * Verifiers to try, in order, for a code typed in the six boxes.
 * App + email shows a single input: once an email code was requested, the code may come from either source.
 */
export const getVerifiers = (
  mode: TwoFactorMode,
  { emailCodeSent }: { emailCodeSent: boolean },
): readonly TwoFactorMethod[] => {
  switch (mode) {
    case "app":
      return ["totp"];
    case "email":
      return ["otp"];
    case "appAndEmail":
      return emailCodeSent ? ["otp", "totp"] : ["totp"];
  }
};

const FALLBACK_ERRORS: ReadonlySet<AuthErrorKind["type"]> = new Set([
  "invalidCode",
  "emailCodeExpired",
  "tooManyCodeAttempts",
]);

/** Whether a failed verification should move on to the next verifier instead of showing the error. */
export const shouldTryNextVerifier = (error: AuthErrorKind): boolean => FALLBACK_ERRORS.has(error.type);
