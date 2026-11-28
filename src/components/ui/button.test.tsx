import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("is disabled while loading", () => {
    render(<Button isLoading>Send</Button>);
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });
});
