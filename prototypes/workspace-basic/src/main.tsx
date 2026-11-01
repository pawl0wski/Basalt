import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../review/comments.js";
import "../review/prototype.js";
import "./styles.css";
import "../review/mostek.css";
import "../review/prototype.css";
import "../review/chrome.css";
import { App } from "./ui/App";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
