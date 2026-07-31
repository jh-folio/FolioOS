import { useEffect, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

type ThemeState = {
  preference: ThemePreference;
  resolved: ResolvedTheme;
};

declare global {
  interface Window {
    FolioTheme?: {
      storageKey: string;
      readonly preference: string;
      readonly resolved: string;
      setPreference: (preference: ThemePreference) => ThemeState;
      refresh: () => ThemeState;
    };
  }
}

export const THEME_PREFERENCE_KEY = "folio.themePreference.v1";

function validPreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

function validResolvedTheme(value: unknown): value is ResolvedTheme {
  return value === "light" || value === "dark";
}

function fallbackState(): ThemeState {
  const preference = validPreference(window.FolioTheme?.preference)
    ? window.FolioTheme.preference
    : "system";
  const resolved = validResolvedTheme(window.FolioTheme?.resolved)
    ? window.FolioTheme.resolved
    : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  return { preference, resolved };
}

export function useThemePreference() {
  const [theme, setTheme] = useState<ThemeState>(fallbackState);

  useEffect(() => {
    const sync = (event?: Event) => {
      const detail = (event as CustomEvent<ThemeState> | undefined)?.detail;
      if (detail && validPreference(detail.preference) && validResolvedTheme(detail.resolved)) {
        setTheme(detail);
        return;
      }
      setTheme(fallbackState());
    };
    window.addEventListener("folio:theme-changed", sync);
    sync();
    return () => window.removeEventListener("folio:theme-changed", sync);
  }, []);

  return {
    ...theme,
    setPreference(preference: ThemePreference) {
      const next = window.FolioTheme?.setPreference(preference);
      setTheme(next || { preference, resolved: preference === "system" ? fallbackState().resolved : preference });
    },
  };
}
