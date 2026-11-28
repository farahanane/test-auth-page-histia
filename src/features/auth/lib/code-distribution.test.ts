import { describe, expect, it } from "vitest";
import {
  CODE_LENGTH,
  applyBackspace,
  applyInput,
  applyPaste,
  emptyCode,
  isCodeComplete,
  joinCode,
} from "./code-distribution";

const digitsOf = (value: string) => value.split("").map((char) => (char === "_" ? "" : char));

describe("emptyCode", () => {
  it("has one empty slot per box", () => {
    expect(emptyCode()).toEqual(["", "", "", "", "", ""]);
    expect(CODE_LENGTH).toBe(6);
  });
});

describe("applyInput", () => {
  it("stores a typed digit and moves focus to the next box", () => {
    expect(applyInput(emptyCode(), 0, "4")).toEqual({ digits: digitsOf("4_____"), focusIndex: 1 });
  });

  it("keeps focus on the last box when typing in it", () => {
    expect(applyInput(digitsOf("12345_"), 5, "6")).toEqual({ digits: digitsOf("123456"), focusIndex: 5 });
  });

  it("replaces the digit of a box that already had one", () => {
    // The browser hands us the old and the new character together.
    expect(applyInput(digitsOf("1_____"), 0, "17")).toEqual({ digits: digitsOf("7_____"), focusIndex: 1 });
  });

  it("ignores non-digit characters", () => {
    expect(applyInput(digitsOf("1_____"), 1, "a")).toEqual({ digits: digitsOf("1_____"), focusIndex: 1 });
  });

  it("clears the box when its content is erased", () => {
    expect(applyInput(digitsOf("123___"), 1, "")).toEqual({ digits: digitsOf("1_3___"), focusIndex: 1 });
  });

  it("treats several new digits at once (autofill) as a paste", () => {
    expect(applyInput(emptyCode(), 0, "123456")).toEqual({ digits: digitsOf("123456"), focusIndex: 5 });
  });
});

describe("applyPaste", () => {
  it("fills all six boxes from the first one whatever box is focused", () => {
    for (let focused = 0; focused < CODE_LENGTH; focused++) {
      expect(applyPaste(emptyCode(), focused, "123456")).toEqual({ digits: digitsOf("123456"), focusIndex: 5 });
    }
  });

  it("strips spaces, dashes and other separators", () => {
    expect(applyPaste(emptyCode(), 3, " 123-456 ").digits).toEqual(digitsOf("123456"));
    expect(applyPaste(emptyCode(), 0, "123 456\n").digits).toEqual(digitsOf("123456"));
  });

  it("overwrites digits already typed", () => {
    expect(applyPaste(digitsOf("999999"), 2, "123456").digits).toEqual(digitsOf("123456"));
  });

  it("keeps only the first six digits of a longer paste", () => {
    expect(applyPaste(emptyCode(), 0, "1234567").digits).toEqual(digitsOf("123456"));
  });

  it("fills from the focused box when fewer than six digits are pasted", () => {
    expect(applyPaste(digitsOf("12____"), 2, "34")).toEqual({ digits: digitsOf("1234__"), focusIndex: 4 });
  });

  it("does not spill past the last box", () => {
    expect(applyPaste(digitsOf("1234__"), 4, "567")).toEqual({ digits: digitsOf("123456"), focusIndex: 5 });
  });

  it("changes nothing when the paste has no digit", () => {
    const digits = digitsOf("12____");
    expect(applyPaste(digits, 2, "abc")).toEqual({ digits, focusIndex: 2 });
  });
});

describe("applyBackspace", () => {
  it("clears the focused box when it has a digit", () => {
    expect(applyBackspace(digitsOf("123___"), 2)).toEqual({ digits: digitsOf("12____"), focusIndex: 2 });
  });

  it("clears the previous box and moves back when the focused box is empty", () => {
    expect(applyBackspace(digitsOf("12____"), 2)).toEqual({ digits: digitsOf("1_____"), focusIndex: 1 });
  });

  it("stays on the first box", () => {
    expect(applyBackspace(emptyCode(), 0)).toEqual({ digits: emptyCode(), focusIndex: 0 });
  });
});

describe("isCodeComplete / joinCode", () => {
  it("is complete only when every box has a digit", () => {
    expect(isCodeComplete(digitsOf("12345_"))).toBe(false);
    expect(isCodeComplete(digitsOf("1_3456"))).toBe(false);
    expect(isCodeComplete(digitsOf("123456"))).toBe(true);
  });

  it("joins the digits into the code sent to the server", () => {
    expect(joinCode(digitsOf("012345"))).toBe("012345");
  });
});

describe("immutability", () => {
  it("never mutates the digits it receives", () => {
    const digits = digitsOf("12____");
    applyInput(digits, 2, "3");
    applyPaste(digits, 0, "999999");
    applyBackspace(digits, 1);
    expect(digits).toEqual(digitsOf("12____"));
  });
});
