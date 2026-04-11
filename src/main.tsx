import { createRoot } from "react-dom/client";
import "./lib/web3modal"; // Initialize Web3Modal before any hooks are used
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
