import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ErrorBanner } from "./ErrorBanner";

describe("ErrorBanner", () => {
    it("is an alert with the title, the message and the action slot", async () => {
        const user = userEvent.setup();
        const onRetry = vi.fn();
        render(
            <ErrorBanner
                title="Could not save"
                message="Folder is read-only."
                action={<button onClick={onRetry}>Retry</button>}
            />,
        );

        const alert = screen.getByRole("alert");
        expect(alert).toHaveTextContent("Could not save");
        expect(alert).toHaveTextContent("Folder is read-only.");
        await user.click(screen.getByRole("button", { name: "Retry" }));
        expect(onRetry).toHaveBeenCalledOnce();
    });

    it("stays an alert for the warning variant and renders without an action", () => {
        render(<ErrorBanner title="t" message="m" variant="warning" />);

        expect(screen.getByRole("alert")).toHaveAttribute(
            "data-variant",
            "warning",
        );
        expect(screen.queryByRole("button")).toBeNull();
    });
});
