import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { I18nProvider } from "./i18n/useT";
import { ToastProvider } from "./components/Toast";
import { ThemeProvider } from "./lib/themeMode";
import "./index.css";

// HashRouter: deep link hoạt động trên GitHub Pages mà không cần cấu hình 404.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
    <I18nProvider>
      <ToastProvider>
        <HashRouter>
          <App />
        </HashRouter>
      </ToastProvider>
    </I18nProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
