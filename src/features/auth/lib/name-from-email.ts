/** Sign-up requires a name but the form has none: the part of the email before the last @ is used. */
export const nameFromEmail = (email: string): string => {
  const trimmed = email.trim();
  const at = trimmed.lastIndexOf("@");
  return at > 0 ? trimmed.slice(0, at) : trimmed;
};
