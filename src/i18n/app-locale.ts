import { notFound } from "next/navigation";
import { locale } from "next/root-params";
import { type AppLocale, isAppLocale } from "./locale";

/**
 * Locale of the current page, from the `[locale]` root segment. Known at build time,
 * so pages using it can still be prerendered with Cache Components. Server Components only.
 */
export const getAppLocale = async (): Promise<AppLocale> => {
  const value = await locale();
  if (!value || !isAppLocale(value)) notFound();
  return value;
};
