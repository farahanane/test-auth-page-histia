import { type CooldownStorage, type CooldownStore, createCooldownStore } from "./cooldown-store";

// Reading `window.localStorage` itself can throw (blocked storage); the store catches it and falls back to memory.
const localStorageAdapter: CooldownStorage = {
  getItem: (key) => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
  removeItem: (key) => window.localStorage.removeItem(key),
};

let store: CooldownStore | undefined;

/** One store per page, so every component showing the same action agrees on the countdown. */
export const getCooldownStore = (): CooldownStore =>
  (store ??= createCooldownStore({ storage: localStorageAdapter, now: () => Date.now() }));
