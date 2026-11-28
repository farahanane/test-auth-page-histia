"use client";

import {
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import {
  CODE_LENGTH,
  type CodeDigits,
  type CodeState,
  applyBackspace,
  applyInput,
  applyPaste,
  emptyCode,
  isCodeComplete,
  joinCode,
} from "../lib/code-distribution";

interface CodeInputProps {
  /** Accessible name of the group of boxes. */
  label: string;
  /** Accessible name of one box, from its 1-based position. */
  digitLabel: (position: number) => string;
  /** Called each time the six boxes hold a new complete code. To clear the boxes, remount with a new `key`. */
  onComplete: (code: string) => void;
  disabled?: boolean;
  errorMessage?: string;
  autoFocus?: boolean;
  className?: string;
}

export const CodeInput = ({
  label,
  digitLabel,
  onComplete,
  disabled = false,
  errorMessage,
  autoFocus = false,
  className,
}: CodeInputProps) => {
  const [digits, setDigits] = useState<CodeDigits>(emptyCode);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const errorId = useId();

  // Mount-only on purpose: focus the first box when the screen appears, not on every re-render.
  useEffect(() => {
    if (autoFocus) boxes.current[0]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const focusBox = (index: number) => boxes.current[Math.max(0, Math.min(index, CODE_LENGTH - 1))]?.focus();

  const update = ({ digits: next, focusIndex }: CodeState) => {
    setDigits(next);
    focusBox(focusIndex);
    const code = joinCode(next);
    if (isCodeComplete(next) && code !== joinCode(digits)) onComplete(code);
  };

  const handleChange = (index: number) => (event: ChangeEvent<HTMLInputElement>) =>
    update(applyInput(digits, index, event.target.value));

  const handlePaste = (index: number) => (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    update(applyPaste(digits, index, event.clipboardData.getData("text")));
  };

  const handleKeyDown = (index: number) => (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      update(applyBackspace(digits, index));
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusBox(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focusBox(index + 1);
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-s", className)}>
      <div role="group" aria-label={label} className="flex justify-center gap-sm">
        {digits.map((digit, index) => (
          <input
            // The six boxes never move, so their position is a stable key.
            key={index}
            ref={(element) => {
              boxes.current[index] = element;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            aria-label={digitLabel(index + 1)}
            aria-invalid={errorMessage ? true : undefined}
            aria-describedby={errorMessage ? errorId : undefined}
            placeholder="0"
            value={digit}
            disabled={disabled}
            onChange={handleChange(index)}
            onPaste={handlePaste(index)}
            onKeyDown={handleKeyDown(index)}
            onFocus={(event) => event.target.select()}
            className={cn(
              "h-20 w-13 rounded-xs border border-white/80 bg-transparent text-center text-l text-white tabular-nums caret-primary",
              "placeholder:text-white/30 focus:border-primary focus:outline-none disabled:opacity-50",
              errorMessage && "border-danger focus:border-danger",
            )}
          />
        ))}
      </div>
      {errorMessage && (
        <p id={errorId} role="alert" className="text-center text-sx text-danger">
          {errorMessage}
        </p>
      )}
    </div>
  );
};
