import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./App.tsx";

const rootElement = document.getElementById("root");

if (rootElement === null) {
    throw new Error("No #root element found in index.html");
}

createRoot(rootElement).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
