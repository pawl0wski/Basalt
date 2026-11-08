import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initI18n } from "./i18n";
import { createPlatform } from "./platform/create-platform";
import "./index.css";

void Promise.all([initI18n(), createPlatform()]).then(() => {
    ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    );
});
