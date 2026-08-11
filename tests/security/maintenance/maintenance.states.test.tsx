/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";

import SecurityMaintenanceError from "@/app/dashboard/admin/security/maintenance/error";
import SecurityMaintenanceLoading from "@/app/dashboard/admin/security/maintenance/loading";

describe("SOC v1.1 Maintenance route states", () => {
  it("provides an accessible loading state", () => {
    render(<SecurityMaintenanceLoading />);

    expect(
      screen
        .getByLabelText("Loading SOC maintenance health")
        .getAttribute("aria-busy"),
    ).toBe("true");
  });

  it("sanitizes unexpected route errors and allows a safe retry", () => {
    const reset = jest.fn();
    render(
      <SecurityMaintenanceError
        error={new Error("DATABASE_URL=postgresql://secret@example.internal/prod")}
        reset={reset}
      />,
    );

    expect(screen.getByRole("alert").textContent).not.toContain("DATABASE_URL");
    expect(screen.getByRole("alert").textContent).not.toContain("example.internal");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
