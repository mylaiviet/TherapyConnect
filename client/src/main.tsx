import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initTracking } from "./services/analytics";

// Initialize anonymous visitor tracking immediately
// This will track users before they log in or sign up
initTracking();

createRoot(document.getElementById("root")!).render(<App />);
