import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CodeInput } from "./code-input";

const labels = {
  label: "Code de vérification",
  digitLabel: (position: number) => `Chiffre ${position} sur 6`,
};

const setup = (props: Partial<React.ComponentProps<typeof CodeInput>> = {}) => {
  const onComplete = vi.fn();
  const user = userEvent.setup();
  render(<CodeInput {...labels} onComplete={onComplete} {...props} />);
  const boxes = screen.getAllByRole("textbox");
  return { user, onComplete, boxes };
};

const valuesOf = (boxes: HTMLElement[]) => boxes.map((box) => (box as HTMLInputElement).value).join("");

describe("CodeInput", () => {
  it("renders six labelled boxes in a labelled group", () => {
    const { boxes } = setup();
    expect(screen.getByRole("group", { name: "Code de vérification" })).toBeInTheDocument();
    expect(boxes).toHaveLength(6);
    expect(screen.getByLabelText("Chiffre 1 sur 6")).toBe(boxes[0]);
    expect(boxes[0]).toHaveAttribute("inputmode", "numeric");
    expect(boxes[0]).toHaveAttribute("autocomplete", "one-time-code");
  });

  it("focuses the first box when asked", () => {
    const { boxes } = setup({ autoFocus: true });
    expect(boxes[0]).toHaveFocus();
  });

  it("moves to the next box after each digit and submits once six digits are in", async () => {
    const { user, boxes, onComplete } = setup();
    await user.click(boxes[0]);
    await user.keyboard("12345");
    expect(boxes[5]).toHaveFocus();
    expect(onComplete).not.toHaveBeenCalled();
    await user.keyboard("6");
    expect(valuesOf(boxes)).toBe("123456");
    expect(onComplete).toHaveBeenCalledExactlyOnceWith("123456");
  });

  it("ignores letters", async () => {
    const { user, boxes } = setup();
    await user.click(boxes[0]);
    await user.keyboard("a");
    expect(boxes[0]).toHaveValue("");
    expect(boxes[0]).toHaveFocus();
  });

  it("spreads a pasted code over the six boxes whatever box was clicked", async () => {
    const { user, boxes, onComplete } = setup();
    await user.click(boxes[3]);
    await user.paste("123 456");
    expect(valuesOf(boxes)).toBe("123456");
    expect(boxes[5]).toHaveFocus();
    expect(onComplete).toHaveBeenCalledExactlyOnceWith("123456");
  });

  it("goes back one box on backspace in an empty box", async () => {
    const { user, boxes } = setup();
    await user.click(boxes[0]);
    await user.keyboard("12");
    await user.keyboard("{Backspace}");
    expect(valuesOf(boxes)).toBe("1");
    expect(boxes[1]).toHaveFocus();
  });

  it("moves with the arrow keys", async () => {
    const { user, boxes } = setup();
    await user.click(boxes[2]);
    await user.keyboard("{ArrowLeft}");
    expect(boxes[1]).toHaveFocus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(boxes[3]).toHaveFocus();
  });

  it("submits again when a digit of a complete code is corrected", async () => {
    const { user, boxes, onComplete } = setup();
    await user.click(boxes[0]);
    await user.paste("123456");
    await user.click(boxes[2]);
    await user.keyboard("9");
    expect(valuesOf(boxes)).toBe("129456");
    expect(onComplete).toHaveBeenLastCalledWith("129456");
    expect(onComplete).toHaveBeenCalledTimes(2);
  });

  it("can be disabled while the code is being checked", () => {
    const { boxes } = setup({ disabled: true });
    boxes.forEach((box) => expect(box).toBeDisabled());
  });

  it("announces its error on every box", () => {
    const { boxes } = setup({ errorMessage: "Code invalide ou expiré." });
    expect(screen.getByRole("alert")).toHaveTextContent("Code invalide ou expiré.");
    boxes.forEach((box) => {
      expect(box).toHaveAttribute("aria-invalid", "true");
      expect(box).toHaveAccessibleDescription("Code invalide ou expiré.");
    });
  });
});
