import { type Dictionary, t } from "intlayer";

const authContent = {
  key: "auth",
  content: {
    signIn: {
      title: t({ fr: "Ravi de vous revoir sur Stolos !", en: "Welcome back to Stolos!" }),
      subtitle: t({ fr: "Connectez-vous à votre compte", en: "Sign in to your account" }),
    },
    signUp: {
      title: t({ fr: "Bienvenue sur Stolos !", en: "Welcome to Stolos!" }),
      subtitle: t({ fr: "Créez votre compte", en: "Create your account" }),
    },
  },
} satisfies Dictionary;

export default authContent;
