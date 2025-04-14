import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./components/theme-provider";
import { registerNodeExecutorsFromRegistry } from "./lib/nodeSystem";

// Initialize folder-based node system
registerNodeExecutorsFromRegistry();

console.log("Folder-based node system initialized");

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light">
    <App />
  </ThemeProvider>
);
