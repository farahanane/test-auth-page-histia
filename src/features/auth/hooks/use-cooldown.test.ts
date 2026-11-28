import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCooldown } from "./use-cooldown";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useCooldown", () => {
  it("is idle when nothing was sent", () => {
    const { result } = renderHook(() => useCooldown("mfa-email-code"));
    expect(result.current.remainingSeconds).toBe(0);
    expect(result.current.isCoolingDown).toBe(false);
  });

  it("counts down every second once started", () => {
    const { result } = renderHook(() => useCooldown("mfa-email-code"));
    act(() => result.current.start(30));
    expect(result.current.remainingSeconds).toBe(30);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.remainingSeconds).toBe(29);
    act(() => vi.advanceTimersByTime(29_000));
    expect(result.current.remainingSeconds).toBe(0);
    expect(result.current.isCoolingDown).toBe(false);
  });

  it("picks up the remaining time after a reload", () => {
    const first = renderHook(() => useCooldown("password-reset"));
    act(() => first.result.current.start(30));
    act(() => vi.advanceTimersByTime(12_000));
    first.unmount();

    const afterReload = renderHook(() => useCooldown("password-reset"));
    expect(afterReload.result.current.remainingSeconds).toBe(18);
  });

  it("shares the cooldown between components of the same action", () => {
    const sender = renderHook(() => useCooldown("mfa-email-code"));
    const display = renderHook(() => useCooldown("mfa-email-code"));
    act(() => sender.result.current.start(30));
    expect(display.result.current.remainingSeconds).toBe(30);
  });
});
