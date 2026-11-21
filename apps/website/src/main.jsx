import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

window.taskflowDeferredInstallPrompt = null;
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  window.taskflowDeferredInstallPrompt = event;
  window.dispatchEvent(new Event("taskflowinstallprompt"));
});
window.addEventListener("appinstalled", () => {
  window.taskflowDeferredInstallPrompt = null;
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("TaskFlow offline support could not be initialized.", error);
    });
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
