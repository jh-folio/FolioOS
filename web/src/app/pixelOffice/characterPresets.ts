import type { AgentCharacterPreset } from "../homePreference";

export type CharacterPreset = {
  id: AgentCharacterPreset;
  label: string;
  asset: string;
  fallbackAsset?: string;
  layout: "single" | "sheet";
  alt: string;
};

export const CHARACTER_PRESETS: readonly CharacterPreset[] = [
  {
    id: "classic",
    label: "클래식 애널리스트",
    asset: "/pixel-office/characters/classic/neutral-front-v3.png?v=sd-classic-3",
    fallbackAsset: "/pixel-office/characters/classic.png?v=pdf-faithful-2",
    layout: "single",
    alt: "네이비 스리피스 수트 차림의 금발 클래식 애널리스트",
  },
  {
    id: "student",
    label: "경제 탐구생",
    asset: "/pixel-office/characters/student.png?v=pdf-faithful-2",
    layout: "sheet",
    alt: "네이비 아카데미 복장으로 의자에 앉은 경제 탐구생",
  },
] as const;

export function characterPresetById(id: AgentCharacterPreset) {
  return CHARACTER_PRESETS.find((preset) => preset.id === id) || CHARACTER_PRESETS[0];
}
