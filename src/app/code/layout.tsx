import type { Metadata } from "next";
import { AppDocument } from "@/components/layout/app-document";

// Root layout of the provided /code helper (left outside the locale routes); its page is unchanged.
export const metadata: Metadata = {
  title: "/code",
};

export default function CodeLayout({ children }: LayoutProps<"/code">) {
  return <AppDocument lang="en">{children}</AppDocument>;
}
