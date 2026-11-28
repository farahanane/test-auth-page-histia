import { useCallback, useSyncExternalStore } from "react";
import { getCooldownStore } from "../lib/browser-cooldown-store";
import type { CooldownAction } from "../lib/cooldown-store";

const TICK_MS = 1000;

/** No countdown is known on the server; the client value takes over after hydration. */
const getServerSnapshot = () => 0;

export const useCooldown = (action: CooldownAction) => {
  const store = getCooldownStore();

  // Re-reads every second; React only re-renders when the number of seconds actually changes.
  const subscribe = useCallback(
    (onChange: () => void) => {
      const unsubscribe = store.subscribe(onChange);
      const timer = setInterval(onChange, TICK_MS);
      return () => {
        unsubscribe();
        clearInterval(timer);
      };
    },
    [store],
  );

  const remainingSeconds = useSyncExternalStore(
    subscribe,
    () => store.getRemainingSeconds(action),
    getServerSnapshot,
  );

  const start = useCallback((seconds: number) => store.start(action, seconds), [store, action]);
  const clear = useCallback(() => store.clear(action), [store, action]);

  return { remainingSeconds, isCoolingDown: remainingSeconds > 0, start, clear };
};
