import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./components/theme-provider";
import { registerNodeExecutorsFromRegistry } from "./lib/nodeSystem";
import { validateAllNodes } from "./lib/nodeValidator";

// Initialize folder-based node system
registerNodeExecutorsFromRegistry();

// Validate all node definitions during development
if (import.meta.env.DEV) {
  // Delay validation to allow dynamic imports to complete
  setTimeout(() => {
    validateAllNodes(true);
  }, 2000);
}

console.log("Folder-based node system initialized");

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light">
    <App />
  </ThemeProvider>
);
