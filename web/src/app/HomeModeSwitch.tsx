import type { HomeMode } from "./homePreference";

export function HomeModeSwitch({ current }: { current: HomeMode }) {
  const other = current === "office" ? "home" : "office";
  return (
    <button
      type="button"
      className="home-mode-switch"
      onClick={() => { window.location.hash = `#/${other}`; }}
      aria-label={other === "office" ? "Pixel Office로 전환" : "Agent Home으로 전환"}
    >
      {other === "office" ? "Pixel Office" : "Agent Home"}
    </button>
  );
}

