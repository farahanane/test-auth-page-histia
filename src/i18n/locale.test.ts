// @vitest-environment node
// Server-side helper: Intlayer's configuration loader needs Node, not jsdom.
import { describe, expect, it } from "vitest";
import { isAppLocale, localizedPath } from "./locale";

describe("isAppLocale", () => {
  it("accepts the configured locales", () => {
    expect(isAppLocale("fr")).toBe(true);
    expect(isAppLocale("en")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isAppLocale("de")).toBe(false);
    expect(isAppLocale("FR")).toBe(false);
    expect(isAppLocale("")).toBe(false);
  });
});

describe("localizedPath", () => {
  it("prefixes an app path with the locale", () => {
    expect(localizedPath("fr", "/login")).toBe("/fr/login");
    expect(localizedPath("en", "/reset-password")).toBe("/en/reset-password");
  });

  it("maps the root to the locale home", () => {
    expect(localizedPath("en", "/")).toBe("/en");
  });
});
