import { z } from "zod";

/** Better-Auth defaults (`minPasswordLength` / `maxPasswordLength`); the README states the minimum. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/** Schemas emit these keys instead of text; the UI translates them. */
export const VALIDATION_MESSAGE_KEYS = [
  "emailRequired",
  "emailInvalid",
  "passwordRequired",
  "passwordTooShort",
  "passwordTooLong",
  "passwordConfirmationRequired",
  "passwordsDoNotMatch",
  "recoveryCodeRequired",
  "recoveryCodeInvalid",
] as const;

export type ValidationMessageKey = (typeof VALIDATION_MESSAGE_KEYS)[number];

export const isValidationMessageKey = (value: string): value is ValidationMessageKey =>
  VALIDATION_MESSAGE_KEYS.some((key) => key === value);

const message = (key: ValidationMessageKey) => ({ error: key });
const required = (key: ValidationMessageKey) => ({ error: key, abort: true });

const email = z.string().trim().min(1, required("emailRequired")).pipe(z.email(message("emailInvalid")));

const newPassword = z
  .string()
  .min(1, required("passwordRequired"))
  .min(PASSWORD_MIN_LENGTH, message("passwordTooShort"))
  .max(PASSWORD_MAX_LENGTH, message("passwordTooLong"));

const confirmPassword = z.string().min(1, required("passwordConfirmationRequired"));

export const signInSchema = z.object({
  email,
  // No policy at sign-in: the server decides whether the credentials are right.
  password: z.string().min(1, required("passwordRequired")),
});

export const signUpSchema = z
  .object({ email, password: newPassword, confirmPassword })
  .refine((values) => values.password === values.confirmPassword, {
    ...message("passwordsDoNotMatch"),
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ newPassword, confirmPassword })
  .refine((values) => values.newPassword === values.confirmPassword, {
    ...message("passwordsDoNotMatch"),
    path: ["confirmPassword"],
  });

/** Better-Auth recovery codes: 10 letters/digits shown as "xxxxx-xxxxx", compared exactly (case-sensitive). */
const RECOVERY_CODE_PATTERN = /^[A-Za-z0-9]{5}-?[A-Za-z0-9]{5}$/;

export const recoveryCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, required("recoveryCodeRequired"))
    .regex(RECOVERY_CODE_PATTERN, message("recoveryCodeInvalid"))
    .transform((code) => (code.includes("-") ? code : `${code.slice(0, 5)}-${code.slice(5)}`)),
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type RecoveryCodeValues = z.infer<typeof recoveryCodeSchema>;
