import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { getSchemaVersion, setSchemaVersion, saveAllProjects } from "./lib/storage";

// Schema migration: wipe old data when upgrading to schema v2
if (getSchemaVersion() !== '2') {
  localStorage.removeItem('alphatrack_v2');       // old storage key
  localStorage.removeItem('alphatrack_projects'); // new key, start clean
  saveAllProjects([]);
  setSchemaVersion();
}

createRoot(document.getElementById("root")!).render(<App />);
