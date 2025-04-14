import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./components/theme-provider";
import { registerAllNodeExecutors } from "./lib/nodeExecutors";
import { registerNodeExecutorsFromRegistry } from "./lib/nodeSystem";

// Initialize node systems
registerAllNodeExecutors();
registerNodeExecutorsFromRegistry();

console.log("Node systems initialized");

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light">
    <App />
  </ThemeProvider>
);
