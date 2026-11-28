"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useCooldown } from "../hooks/use-cooldown";
import type { CooldownAction } from "../lib/cooldown-store";

interface ResendButtonProps {
  action: CooldownAction;
  /** Sends the code or link; the caller starts the cooldown from the server's answer. */
  onResend: () => void;
  isPending?: boolean;
  /** Translated countdown text, e.g. `(30s)`. */
  formatCountdown: (seconds: number) => string;
  children: ReactNode;
  className?: string;
}

export const ResendButton = ({
  action,
  onResend,
  isPending = false,
  formatCountdown,
  children,
  className,
}: ResendButtonProps) => {
  const { remainingSeconds, isCoolingDown } = useCooldown(action);

  return (
    <Button
      type="button"
      variant="ghostDark"
      textSize="sx"
      className={className}
      disabled={isCoolingDown}
      isLoading={isPending}
      onClick={onResend}
    >
      {children}
      {isCoolingDown && <span className="tabular-nums">{formatCountdown(remainingSeconds)}</span>}
    </Button>
  );
};
