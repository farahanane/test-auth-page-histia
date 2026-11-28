import { describe, expect, it, vi } from "vitest";
import { type CooldownStorage, createCooldownStore } from "./cooldown-store";

const createMemoryStorage = (): CooldownStorage & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
};

const setup = (storage: CooldownStorage = createMemoryStorage()) => {
  let time = 1_000_000;
  const store = createCooldownStore({ storage, now: () => time });
  return { store, storage, advance: (ms: number) => (time += ms) };
};

describe("createCooldownStore", () => {
  it("has no cooldown before anything was sent", () => {
    const { store } = setup();
    expect(store.getRemainingSeconds("mfa-email-code")).toBe(0);
  });

  it("counts down from the given duration", () => {
    const { store, advance } = setup();
    store.start("mfa-email-code", 30);
    expect(store.getRemainingSeconds("mfa-email-code")).toBe(30);
    advance(10_000);
    expect(store.getRemainingSeconds("mfa-email-code")).toBe(20);
    advance(19_500);
    expect(store.getRemainingSeconds("mfa-email-code")).toBe(1);
    advance(500);
    expect(store.getRemainingSeconds("mfa-email-code")).toBe(0);
  });

  it("keeps each action separate", () => {
    const { store } = setup();
    store.start("password-reset", 30);
    expect(store.getRemainingSeconds("mfa-email-code")).toBe(0);
    expect(store.getRemainingSeconds("password-reset")).toBe(30);
  });

  it("survives a reload: a new store on the same storage sees the same deadline", () => {
    const storage = createMemoryStorage();
    const first = setup(storage);
    first.store.start("mfa-email-code", 30);

    let time = 1_000_000 + 12_000;
    const afterReload = createCooldownStore({ storage, now: () => time });
    expect(afterReload.getRemainingSeconds("mfa-email-code")).toBe(18);
    time += 18_000;
    expect(afterReload.getRemainingSeconds("mfa-email-code")).toBe(0);
  });

  it("lets a later start (e.g. the server's X-Retry-After) replace the deadline", () => {
    const { store } = setup();
    store.start("mfa-email-code", 30);
    store.start("mfa-email-code", 12);
    expect(store.getRemainingSeconds("mfa-email-code")).toBe(12);
  });

  it("can be cleared", () => {
    const { store } = setup();
    store.start("mfa-email-code", 30);
    store.clear("mfa-email-code");
    expect(store.getRemainingSeconds("mfa-email-code")).toBe(0);
  });

  it("ignores corrupted stored values", () => {
    const storage = createMemoryStorage();
    storage.setItem("stolos:cooldown:mfa-email-code", "not-a-date");
    const { store } = setup(storage);
    expect(store.getRemainingSeconds("mfa-email-code")).toBe(0);
  });

  it("never reports more than the longest cooldown, even if storage was tampered with", () => {
    const storage = createMemoryStorage();
    storage.setItem("stolos:cooldown:mfa-email-code", String(Number.MAX_SAFE_INTEGER));
    const { store } = setup(storage);
    expect(store.getRemainingSeconds("mfa-email-code")).toBeLessThanOrEqual(3600);
  });

  it("keeps working in memory when storage throws (private mode, blocked storage)", () => {
    const throwing: CooldownStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    const { store } = setup(throwing);
    expect(store.getRemainingSeconds("mfa-email-code")).toBe(0);
    store.start("mfa-email-code", 30);
    expect(store.getRemainingSeconds("mfa-email-code")).toBe(30);
  });

  it("notifies subscribers when a cooldown starts or is cleared, until they unsubscribe", () => {
    const { store } = setup();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.start("mfa-email-code", 30);
    store.clear("mfa-email-code");
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    store.start("mfa-email-code", 30);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
