import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { TextField } from "./text-field";

describe("TextField", () => {
  it("is labelled by its floating label", () => {
    render(<TextField label="Adresse courriel" type="email" />);
    expect(screen.getByLabelText("Adresse courriel")).toHaveAttribute("type", "email");
  });

  it("accepts typing", async () => {
    const user = userEvent.setup();
    render(<TextField label="Adresse courriel" />);
    await user.type(screen.getByLabelText("Adresse courriel"), "a@b.co");
    expect(screen.getByLabelText("Adresse courriel")).toHaveValue("a@b.co");
  });

  it("shows no error by default", () => {
    render(<TextField label="Adresse courriel" />);
    expect(screen.getByLabelText("Adresse courriel")).not.toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("announces its error and links it to the input", () => {
    render(<TextField label="Adresse courriel" errorMessage="Adresse courriel invalide." />);
    const input = screen.getByLabelText("Adresse courriel");
    expect(screen.getByRole("alert")).toHaveTextContent("Adresse courriel invalide.");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Adresse courriel invalide.");
  });

  it("forwards its ref to the input (React Hook Form register)", () => {
    const ref = createRef<HTMLInputElement>();
    render(<TextField ref={ref} label="Adresse courriel" />);
    expect(ref.current).toBe(screen.getByLabelText("Adresse courriel"));
  });
});
