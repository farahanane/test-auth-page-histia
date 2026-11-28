/** Actions whose resend the server limits (README: 30 s, enforced by Better-Auth's rate limiter). */
export type CooldownAction = "mfa-email-code" | "password-reset";

export type CooldownStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

interface CooldownStoreOptions {
  storage: CooldownStorage;
  now: () => number;
}

export interface CooldownStore {
  getRemainingSeconds: (action: CooldownAction) => number;
  /** Starts (or replaces) the cooldown; also used with the server's X-Retry-After after a 429. */
  start: (action: CooldownAction, seconds: number) => void;
  clear: (action: CooldownAction) => void;
  subscribe: (listener: () => void) => () => void;
}

/** Upper bound for a stored deadline, so a tampered value cannot lock the button for ever. */
const MAX_COOLDOWN_SECONDS = 3600;

const storageKey = (action: CooldownAction) => `stolos:cooldown:${action}`;

const parseDeadline = (raw: string | null): number | null => {
  if (raw === null) return null;
  const deadline = Number(raw);
  return Number.isFinite(deadline) ? deadline : null;
};

/**
 * Mirrors the server's resend cooldown on the client. The deadline is persisted so the countdown
 * stays right after a reload; if storage is unavailable it falls back to memory for this page.
 */
export const createCooldownStore = ({ storage, now }: CooldownStoreOptions): CooldownStore => {
  const memory = new Map<CooldownAction, number>();
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());

  const readDeadline = (action: CooldownAction): number | null => {
    try {
      return parseDeadline(storage.getItem(storageKey(action)));
    } catch {
      return memory.get(action) ?? null;
    }
  };

  return {
    getRemainingSeconds: (action) => {
      const deadline = readDeadline(action);
      if (deadline === null) return 0;
      const remainingMs = deadline - now();
      return remainingMs > 0 ? Math.min(Math.ceil(remainingMs / 1000), MAX_COOLDOWN_SECONDS) : 0;
    },
    start: (action, seconds) => {
      const deadline = now() + seconds * 1000;
      memory.set(action, deadline);
      try {
        storage.setItem(storageKey(action), String(deadline));
      } catch {
        // Storage blocked: the in-memory deadline still drives the countdown for this page.
      }
      notify();
    },
    clear: (action) => {
      memory.delete(action);
      try {
        storage.removeItem(storageKey(action));
      } catch {
        // Storage blocked: nothing persisted to remove.
      }
      notify();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};
