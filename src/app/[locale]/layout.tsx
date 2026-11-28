import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IntlayerProvider } from "next-intlayer/server";
import { AppDocument } from "@/components/layout/app-document";
import { QueryProvider } from "@/components/providers/query-provider";
import { isAppLocale } from "@/i18n/locale";

export { generateStaticParams } from "next-intlayer";

export const metadata: Metadata = {
  title: "Stolos",
};

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();

  return (
    <AppDocument lang={locale}>
      <IntlayerProvider locale={locale}>
        <QueryProvider>{children}</QueryProvider>
      </IntlayerProvider>
    </AppDocument>
  );
}
