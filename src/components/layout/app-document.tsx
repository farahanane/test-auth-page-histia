import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import "@/app/globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

interface AppDocumentProps {
  lang: string;
  children: ReactNode;
}

/** `<html>`/`<body>` shared by the root layouts (`/[locale]`, `/code`, `/email`). */
export const AppDocument = ({ lang, children }: AppDocumentProps) => (
  <html lang={lang} className={`${inter.variable} h-full antialiased`}>
    <body className="flex min-h-full flex-col">{children}</body>
  </html>
);
