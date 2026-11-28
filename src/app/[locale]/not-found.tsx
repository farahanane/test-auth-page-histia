import { getIntlayer } from "intlayer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { getAppLocale } from "@/i18n/app-locale";
import { localizedPath } from "@/i18n/locale";

export default async function NotFound() {
  const locale = await getAppLocale();
  const { title, description, backToSignIn } = getIntlayer("not-found", locale);

  return (
    <AuthShell logoLabel="Stolos">
      <AuthCard title={title} subtitle={description}>
        <div className="flex justify-center">
          <Button asChild variant="ghostDark">
            <Link href={localizedPath(locale, "/login")}>{backToSignIn}</Link>
          </Button>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
