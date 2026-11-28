import { notFound, redirect } from "next/navigation";
import { isAppLocale, localizedPath } from "@/i18n/locale";

export default async function LocaleHomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();
  redirect(localizedPath(locale, "/login"));
}
