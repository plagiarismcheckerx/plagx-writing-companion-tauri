import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/inter/index.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import App from "./App";
import { ToastProvider } from "./components/Toast";
import "./styles.css";
import { getItem, KEYS } from "./lib/storage";

document.documentElement.dataset.theme = getItem<string>(KEYS.theme) ?? "light";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>,
);
