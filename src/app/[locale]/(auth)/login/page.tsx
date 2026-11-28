import { getIntlayer } from "intlayer";
import { AuthCard } from "@/features/auth/components/auth-card";
import { getAppLocale } from "@/i18n/app-locale";

// Step 3: shell only. Step 4 replaces the body with the sign-in / sign-up tabs.
export default async function LoginPage() {
  const { signIn } = getIntlayer("auth", await getAppLocale());

  return (
    <AuthCard title={signIn.title} subtitle={signIn.subtitle}>
      {null}
    </AuthCard>
  );
}
