import { configuration, type LocalesValues } from "intlayer";

/** One of the locales declared in `intlayer.config.ts` (fr, en). */
export type AppLocale = LocalesValues;

export const isAppLocale = (value: string): value is AppLocale =>
  configuration.internationalization.locales.some((locale) => locale === value);

/** `/login` → `/fr/login`. Every page lives under its locale ("prefix-all" routing). */
export const localizedPath = (locale: AppLocale, path: `/${string}`): string =>
  path === "/" ? `/${locale}` : `/${locale}${path}`;
