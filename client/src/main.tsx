import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./components/theme-provider";
import { initializeNodeSystem } from "./lib/nodeSystem";
import { validateAllNodes } from "./lib/nodeValidator";

// Initialize node system with both folder-based and custom nodes
initializeNodeSystem().catch(error => {
  console.error("Error initializing node system:", error);
});

// Validate all node definitions during development
if (import.meta.env.DEV) {
  // Delay validation to allow dynamic imports to complete
  setTimeout(() => {
    validateAllNodes(true);
  }, 2000);
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light">
    <App />
  </ThemeProvider>
);
