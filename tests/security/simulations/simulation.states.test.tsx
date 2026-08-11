/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";

import SecuritySimulationsError from "@/app/dashboard/admin/security/simulations/error";
import SecuritySimulationsLoading from "@/app/dashboard/admin/security/simulations/loading";

describe("SOC v1.1 Simulation route states", () => {
  it("provides an accessible loading state", () => {
    render(<SecuritySimulationsLoading />);
    expect(screen.getByLabelText("Loading SOC simulations").getAttribute("aria-busy")).toBe("true");
  });

  it("sanitizes route errors and provides a retry", () => {
    const reset = jest.fn();
    render(<SecuritySimulationsError error={new Error("DATABASE_URL=secret") } reset={reset} />);
    expect(screen.getByRole("alert").textContent).not.toContain("DATABASE_URL");
    expect(screen.getByRole("alert").textContent).not.toContain("secret");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
