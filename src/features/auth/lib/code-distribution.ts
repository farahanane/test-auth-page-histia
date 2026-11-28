export const CODE_LENGTH = 6;

const LAST_INDEX = CODE_LENGTH - 1;

/** One entry per box: a single digit, or "" when empty. */
export type CodeDigits = readonly string[];

export interface CodeState {
  digits: CodeDigits;
  focusIndex: number;
}

const onlyDigits = (value: string) => value.replace(/\D/g, "");

const withDigitAt = (digits: CodeDigits, index: number, digit: string): string[] =>
  digits.map((current, position) => (position === index ? digit : current));

const removeFirst = (value: string, char: string) => {
  const position = value.indexOf(char);
  return position === -1 ? value : value.slice(0, position) + value.slice(position + 1);
};

export const emptyCode = (): string[] => Array.from({ length: CODE_LENGTH }, () => "");

/** A full code always fills every box from the first one, whatever box is focused. */
export const applyPaste = (digits: CodeDigits, index: number, text: string): CodeState => {
  const pasted = onlyDigits(text);
  if (!pasted) return { digits, focusIndex: index };

  if (pasted.length >= CODE_LENGTH) {
    return { digits: pasted.slice(0, CODE_LENGTH).split(""), focusIndex: LAST_INDEX };
  }

  const next = [...digits];
  for (const [offset, digit] of pasted.slice(0, CODE_LENGTH - index).split("").entries()) {
    next[index + offset] = digit;
  }
  return { digits: next, focusIndex: Math.min(index + pasted.length, LAST_INDEX) };
};

/** Value of a box after a change event; may hold the previous digit plus the new one, or a whole autofilled code. */
export const applyInput = (digits: CodeDigits, index: number, value: string): CodeState => {
  if (value === "") return { digits: withDigitAt(digits, index, ""), focusIndex: index };

  const previous = digits[index] ?? "";
  const typed = onlyDigits(value);
  const fresh = previous && typed.length > 1 ? removeFirst(typed, previous) : typed;

  if (!fresh) return { digits, focusIndex: index };
  if (fresh.length > 1) return applyPaste(digits, index, fresh);
  return { digits: withDigitAt(digits, index, fresh), focusIndex: Math.min(index + 1, LAST_INDEX) };
};

export const applyBackspace = (digits: CodeDigits, index: number): CodeState => {
  if (digits[index]) return { digits: withDigitAt(digits, index, ""), focusIndex: index };
  if (index === 0) return { digits, focusIndex: 0 };
  return { digits: withDigitAt(digits, index - 1, ""), focusIndex: index - 1 };
};

export const isCodeComplete = (digits: CodeDigits): boolean =>
  digits.length === CODE_LENGTH && digits.every((digit) => /^\d$/.test(digit));

export const joinCode = (digits: CodeDigits): string => digits.join("");
