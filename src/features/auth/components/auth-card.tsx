import { type ReactNode, useId } from "react";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** The glass card of the Figma screens (594 px wide); a region named by its title. */
export const AuthCard = ({ title, subtitle, children, className }: AuthCardProps) => {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className={cn("glassmorphism w-full max-w-[37.125rem] rounded-m px-[clamp(1.5rem,4vw,3rem)] py-4xl", className)}
    >
      <header className="flex flex-col items-center gap-s text-center">
        <h1 id={titleId} className="text-lm font-semibold">
          {title}
        </h1>
        {subtitle && <p className="text-s text-white/80">{subtitle}</p>}
      </header>
      <div className="mt-2xl">{children}</div>
    </section>
  );
};
