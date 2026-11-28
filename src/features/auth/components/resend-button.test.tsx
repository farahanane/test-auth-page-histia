import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCooldownStore } from "../lib/browser-cooldown-store";
import { ResendButton } from "./resend-button";

const renderButton = (props: Partial<React.ComponentProps<typeof ResendButton>> = {}) => {
  const onResend = vi.fn();
  const utils = render(
    <ResendButton action="mfa-email-code" onResend={onResend} formatCountdown={(s) => `(${s}s)`} {...props}>
      Renvoyer un code
    </ResendButton>,
  );
  return { onResend, ...utils };
};

beforeEach(() => {
  // Only what the countdown uses: faking setTimeout too would hang Testing Library's async wrapper.
  vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ResendButton", () => {
  it("is enabled without a countdown when nothing was sent", async () => {
    const user = userEvent.setup();
    const { onResend } = renderButton();
    const button = screen.getByRole("button", { name: "Renvoyer un code" });
    expect(button).toBeEnabled();
    await user.click(button);
    expect(onResend).toHaveBeenCalledOnce();
  });

  it("is disabled with a visible countdown during the cooldown, then enabled again", () => {
    renderButton();
    act(() => getCooldownStore().start("mfa-email-code", 30));
    const button = screen.getByRole("button", { name: /Renvoyer un code/ });
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("(30s)");

    act(() => vi.advanceTimersByTime(10_000));
    expect(button).toHaveTextContent("(20s)");

    act(() => vi.advanceTimersByTime(20_000));
    expect(button).toBeEnabled();
    expect(button).not.toHaveTextContent(/\(\d+s\)/);
  });

  it("keeps the right countdown after a reload", () => {
    getCooldownStore().start("mfa-email-code", 30);
    vi.advanceTimersByTime(25_000);
    renderButton();
    expect(screen.getByRole("button", { name: /Renvoyer un code/ })).toHaveTextContent("(5s)");
  });

  it("ignores the cooldown of another action", () => {
    getCooldownStore().start("password-reset", 30);
    renderButton();
    expect(screen.getByRole("button", { name: "Renvoyer un code" })).toBeEnabled();
  });

  it("is disabled while a send is in progress", () => {
    renderButton({ isPending: true });
    expect(screen.getByRole("button", { name: /Renvoyer un code/ })).toBeDisabled();
  });
});
