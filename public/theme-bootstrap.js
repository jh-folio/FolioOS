(function () {
  "use strict";

  const STORAGE_KEY = "folio.themePreference.v1";
  const THEMES = new Set(["light", "dark", "system"]);
  const media = window.matchMedia("(prefers-color-scheme: dark)");

  function storedPreference() {
    try {
      const value = window.localStorage.getItem(STORAGE_KEY) || "";
      return THEMES.has(value) ? value : "";
    } catch {
      return "";
    }
  }

  function hasExistingFolioState() {
    try {
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index) || "";
        if (key.startsWith("folio.") && key !== STORAGE_KEY) return true;
      }
    } catch {
      return false;
    }
    return false;
  }

  function initialPreference() {
    const stored = storedPreference();
    if (stored) return stored;
    const fallback = hasExistingFolioState() ? "light" : "system";
    try {
      window.localStorage.setItem(STORAGE_KEY, fallback);
    } catch {
      // The resolved theme remains available for this page when storage is blocked.
    }
    return fallback;
  }

  function resolvedTheme(preference) {
    if (preference === "dark" || preference === "light") return preference;
    return media.matches ? "dark" : "light";
  }

  function apply(preference, notify) {
    const safePreference = THEMES.has(preference) ? preference : "system";
    const resolved = resolvedTheme(safePreference);
    const root = document.documentElement;
    root.dataset.themePreference = safePreference;
    root.dataset.theme = resolved;
    root.classList.toggle("dark", resolved === "dark");
    if (notify) {
      window.dispatchEvent(new CustomEvent("folio:theme-changed", {
        detail: { preference: safePreference, resolved },
      }));
    }
    return { preference: safePreference, resolved };
  }

  function setPreference(preference) {
    const safePreference = THEMES.has(preference) ? preference : "system";
    try {
      window.localStorage.setItem(STORAGE_KEY, safePreference);
    } catch {
      // Applying the in-memory preference still keeps the current page usable.
    }
    return apply(safePreference, true);
  }

  let current = apply(initialPreference(), false);

  function syncSystemTheme() {
    if (current.preference !== "system") return;
    current = apply("system", true);
  }

  function syncStoredTheme(event) {
    if (event.key !== STORAGE_KEY) return;
    current = apply(storedPreference() || "system", true);
  }

  media.addEventListener?.("change", syncSystemTheme);
  window.addEventListener("storage", syncStoredTheme);

  window.FolioTheme = {
    storageKey: STORAGE_KEY,
    get preference() {
      return document.documentElement.dataset.themePreference || current.preference;
    },
    get resolved() {
      return document.documentElement.dataset.theme || current.resolved;
    },
    setPreference(preference) {
      current = setPreference(preference);
      return current;
    },
    refresh() {
      current = apply(storedPreference() || current.preference || "system", true);
      return current;
    },
  };
}());
