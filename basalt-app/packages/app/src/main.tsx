import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initI18n } from "./i18n";
import { createPlatform } from "./platform/create-platform";
import { ServicesProvider } from "./ServicesProvider";
import { createServices } from "./services";
import "./index.css";

void Promise.all([initI18n(), createPlatform()]).then(([i18n, platform]) => {
    const services = createServices(platform, {
        untitledName: () => i18n.t("notes.untitled"),
    });
    ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
        <React.StrictMode>
            <ServicesProvider services={services}>
                <App />
            </ServicesProvider>
        </React.StrictMode>,
    );
});
