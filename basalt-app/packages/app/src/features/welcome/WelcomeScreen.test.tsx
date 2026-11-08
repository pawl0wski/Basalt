import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { initI18n } from "../../i18n";
import en from "../../i18n/locales/en.json";
import { WelcomeScreen } from "./WelcomeScreen";
import { WelcomeScreenContainer } from "./WelcomeScreenContainer";

describe("WelcomeScreenContainer", () => {
    beforeAll(async () => {
        await initI18n();
    });

    it("renders every welcome text from the English resources", () => {
        render(<WelcomeScreenContainer />);

        expect(
            screen.getByRole("heading", {
                level: 1,
                name: en.welcome.headline,
            }),
        ).toBeInTheDocument();
        expect(screen.getByText(en.welcome.intro)).toBeInTheDocument();
        expect(screen.getByText(en.welcome.folderHint)).toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: en.welcome.brand }),
        ).toBeInTheDocument();
        for (const { title, description } of Object.values(
            en.welcome.principles,
        )) {
            expect(
                screen.getByRole("heading", { level: 2, name: title }),
            ).toBeInTheDocument();
            expect(screen.getByText(description)).toBeInTheDocument();
        }
    });

    it("offers a single open-folder action", () => {
        render(<WelcomeScreenContainer />);

        expect(screen.getAllByRole("button")).toHaveLength(1);
        expect(
            screen.getByRole("button", { name: "Open folder as workspace" }),
        ).toBeInTheDocument();
    });
});

describe("WelcomeScreen", () => {
    it("shows the texts it is given without translating", async () => {
        const onOpenFolder = vi.fn();
        render(
            <WelcomeScreen
                texts={{
                    brand: "B",
                    headline: "H",
                    intro: "I",
                    openFolder: "Open",
                    folderHint: "F",
                }}
                principles={[{ id: "markdown", title: "T", description: "D" }]}
                onOpenFolder={onOpenFolder}
            />,
        );

        await userEvent.click(screen.getByRole("button", { name: "Open" }));

        expect(onOpenFolder).toHaveBeenCalledTimes(1);
        expect(
            screen.getByRole("heading", { level: 1, name: "H" }),
        ).toBeInTheDocument();
        expect(screen.getAllByRole("article")).toHaveLength(1);
    });
});
