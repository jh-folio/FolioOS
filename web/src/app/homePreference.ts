import { useEffect, useState } from "react";
import type { RouteId } from "./routes";

export type HomeMode = "office" | "home";
export type AgentCharacterPreset = "classic" | "student";
export type MotionPreference = "system" | "reduced";

export type UiPreferences = {
  home: { mode: HomeMode; choiceSeen: boolean };
  character: { preset: AgentCharacterPreset; name: string };
  motion: MotionPreference;
};

export const HOME_PREFERENCE_KEY = "folio.homePreference.v1";
export const CHARACTER_PREFERENCE_KEY = "folio.agentCharacter.v1";
export const MOTION_PREFERENCE_KEY = "folio.motionPreference.v1";
export const UI_PREFERENCE_EVENT = "folio:ui-preferences-updated";

const DEFAULT_PREFERENCES: UiPreferences = {
  home: { mode: "home", choiceSeen: true },
  character: { preset: "classic", name: "" },
  motion: "system",
};

function storageValue(key: string) {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function parseObject(raw: string): Record<string, unknown> {
  if (!raw) return {};
  try {
    const value = JSON.parse(raw);
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

export function readUiPreferences(): UiPreferences {
  const home = parseObject(storageValue(HOME_PREFERENCE_KEY));
  const character = parseObject(storageValue(CHARACTER_PREFERENCE_KEY));
  const motion = storageValue(MOTION_PREFERENCE_KEY);
  return {
    home: {
      mode: home.mode === "home" ? "home" : "office",
      choiceSeen: home.choiceSeen === true,
    },
    character: {
      preset: character.preset === "student" ? "student" : "classic",
      name: typeof character.name === "string" ? character.name.trim().slice(0, 30) : "",
    },
    motion: motion === "reduced" ? "reduced" : "system",
  };
}

function writePreference(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
  } catch {
    // In-memory React state remains usable if localStorage is unavailable.
  }
}

function announce(preferences: UiPreferences) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<UiPreferences>(UI_PREFERENCE_EVENT, { detail: preferences }));
}

export function saveUiPreferences(preferences: UiPreferences) {
  writePreference(HOME_PREFERENCE_KEY, preferences.home);
  writePreference(CHARACTER_PREFERENCE_KEY, preferences.character);
  writePreference(MOTION_PREFERENCE_KEY, preferences.motion);
  announce(preferences);
  return preferences;
}

export function resetUiPreferences() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(HOME_PREFERENCE_KEY);
      window.localStorage.removeItem(CHARACTER_PREFERENCE_KEY);
      window.localStorage.removeItem(MOTION_PREFERENCE_KEY);
    } catch {
      // Reset the current session even when persistence is unavailable.
    }
  }
  const defaults = structuredClone(DEFAULT_PREFERENCES);
  announce(defaults);
  return defaults;
}

// Pixel Office 보류 동안에는 저장된 선택과 무관하게 Agent Home으로 들어간다.
// 선택값 자체는 지우지 않으므로 재개할 때 사용자의 이전 선택이 살아 있다.
export function preferredHomeRoute(_preferences = readUiPreferences()): RouteId {
  return "home";
}

export function useUiPreferences() {
  const [preferences, setPreferences] = useState<UiPreferences>(() => readUiPreferences());

  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const detail = (event as CustomEvent<UiPreferences>).detail;
      setPreferences(detail || readUiPreferences());
    };
    const handleStorage = () => setPreferences(readUiPreferences());
    window.addEventListener(UI_PREFERENCE_EVENT, handleUpdate);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(UI_PREFERENCE_EVENT, handleUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  function commit(next: UiPreferences) {
    setPreferences(next);
    saveUiPreferences(next);
  }

  return {
    preferences,
    setHome(mode: HomeMode, choiceSeen = true) {
      commit({ ...preferences, home: { mode, choiceSeen } });
    },
    setCharacter(preset: AgentCharacterPreset, name = preferences.character.name) {
      commit({ ...preferences, character: { preset, name: name.trim().slice(0, 30) } });
    },
    setMotion(motion: MotionPreference) {
      commit({ ...preferences, motion });
    },
    reset() {
      const defaults = resetUiPreferences();
      setPreferences(defaults);
    },
  };
}

