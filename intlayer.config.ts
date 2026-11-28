import { type IntlayerConfig, Locales } from "intlayer";

const config: IntlayerConfig = {
  internationalization: {
    locales: [Locales.FRENCH, Locales.ENGLISH],
    defaultLocale: Locales.FRENCH,
  },
  routing: {
    // Every page carries its locale: /fr/login, /en/login. A bare /login is redirected.
    mode: "prefix-all",
  },
};

export default config;
