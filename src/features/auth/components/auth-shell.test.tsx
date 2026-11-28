import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthCard } from "./auth-card";
import { AuthShell } from "./auth-shell";

describe("AuthShell", () => {
  it("shows the Stolos logo with its accessible name and the page content", () => {
    render(
      <AuthShell logoLabel="Stolos">
        <p>content</p>
      </AuthShell>,
    );
    expect(screen.getByRole("img", { name: "Stolos" })).toBeInTheDocument();
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("hides the decorative background from assistive technologies", () => {
    const { container } = render(<AuthShell logoLabel="Stolos">x</AuthShell>);
    expect(container.querySelector("[data-auth-background]")).toHaveAttribute("aria-hidden", "true");
  });

  it("renders a background slot behind the content (company cards)", () => {
    render(
      <AuthShell logoLabel="Stolos" background={<div>cards</div>}>
        x
      </AuthShell>,
    );
    expect(screen.getByText("cards").closest("[data-auth-background]")).not.toBeNull();
  });
});

describe("AuthCard", () => {
  it("is a landmark section named by its heading", () => {
    render(
      <AuthCard title="Ravi de vous revoir sur Stolos !" subtitle="Connectez-vous à votre compte">
        <p>form</p>
      </AuthCard>,
    );
    const card = screen.getByRole("region", { name: "Ravi de vous revoir sur Stolos !" });
    expect(card).toContainElement(screen.getByRole("heading", { level: 1, name: "Ravi de vous revoir sur Stolos !" }));
    expect(card).toHaveTextContent("Connectez-vous à votre compte");
    expect(card).toHaveTextContent("form");
  });

  it("can have no subtitle", () => {
    render(<AuthCard title="Confirmez votre identité">x</AuthCard>);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Confirmez votre identité");
  });
});
