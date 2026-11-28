import type { CSSProperties, ReactNode } from "react";
import { StolosLogo } from "@/components/brand/stolos-logo";

interface AuthShellProps {
  /** Translated accessible name of the logo. */
  logoLabel: string;
  /** Decorative layer behind the card (the company cards). */
  background?: ReactNode;
  children: ReactNode;
}

// Violet glows at the top and bottom centre of the Figma frames.
const backgroundStyle: CSSProperties = {
  backgroundColor: "#211c40",
  backgroundImage: [
    "radial-gradient(ellipse 32% 28% at 50% 0%, rgb(112 96 196 / 0.55), transparent 70%)",
    "radial-gradient(ellipse 34% 22% at 50% 100%, rgb(112 96 196 / 0.6), transparent 70%)",
  ].join(", "),
};

/** Layout shared by every auth screen: background, logo at the top, card centred below. */
export const AuthShell = ({ logoLabel, background, children }: AuthShellProps) => (
  <div className="relative isolate flex min-h-dvh w-full flex-col items-center overflow-hidden">
    <div
      data-auth-background
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={backgroundStyle}
    >
      {background}
    </div>
    <header className="pt-[clamp(1.5rem,9vh,6.25rem)]">
      <StolosLogo label={logoLabel} className="h-[clamp(5rem,14vh,9.5rem)] w-auto drop-shadow-[0_8px_24px_rgb(0_0_0/0.35)]" />
    </header>
    <main className="flex w-full flex-1 items-center justify-center px-m pt-xl pb-[clamp(1.5rem,11vh,7.5rem)]">
      {children}
    </main>
  </div>
);
