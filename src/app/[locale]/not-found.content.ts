import { type Dictionary, t } from "intlayer";

const notFoundContent = {
  key: "not-found",
  content: {
    title: t({ fr: "Page introuvable", en: "Page not found" }),
    description: t({
      fr: "Cette page n'existe pas ou a été déplacée.",
      en: "This page does not exist or has been moved.",
    }),
    backToSignIn: t({ fr: "Retour à la connexion", en: "Back to sign in" }),
  },
} satisfies Dictionary;

export default notFoundContent;
