import { describe, expect, it } from "vitest";
import { nameFromEmail } from "./name-from-email";

describe("nameFromEmail", () => {
  it("uses the part before the @", () => {
    expect(nameFromEmail("jane.doe@example.com")).toBe("jane.doe");
  });

  it("ignores surrounding whitespace", () => {
    expect(nameFromEmail("  jane@example.com ")).toBe("jane");
  });

  it("uses the last @ so a quoted local part keeps its own @", () => {
    expect(nameFromEmail('"a@b"@example.com')).toBe('"a@b"');
  });

  it("falls back to the whole value when there is no local part", () => {
    expect(nameFromEmail("@example.com")).toBe("@example.com");
    expect(nameFromEmail("no-at-sign")).toBe("no-at-sign");
  });
});
