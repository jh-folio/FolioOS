import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { MarketStateDashboard } from "./islands/MarketStateDashboard";

// Island registry: each entry mounts a React component into a pre-existing DOM
// root rendered by the vanilla public/ shell. New surfaces are added here as
// the gradual migration proceeds; unmatched roots are simply skipped.
const ISLANDS: Record<string, () => JSX.Element> = {
  "market-state": () => <MarketStateDashboard />,
};

function mountIslands() {
  document.querySelectorAll<HTMLElement>("[data-react-island]").forEach((el) => {
    const name = el.dataset.reactIsland || "";
    const factory = ISLANDS[name];
    if (!factory || el.dataset.reactMounted === "1") return;
    el.dataset.reactMounted = "1";
    createRoot(el).render(<StrictMode>{factory()}</StrictMode>);
  });
}

function mountApp(): boolean {
  const root = document.getElementById("folioReactRoot");
  if (!root) return false;
  if (root.dataset.reactMounted === "1") return true;

  root.dataset.reactMounted = "1";
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  return true;
}

function mountReactSurfaces() {
  mountApp();
  mountIslands();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountReactSurfaces);
} else {
  mountReactSurfaces();
}
