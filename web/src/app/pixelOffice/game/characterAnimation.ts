import { Rectangle, Texture, type Sprite } from "pixi.js";
import type { MovementFacing } from "./movementMachine";

export const CHARACTER_ANIMATION_ROWS = [
  "down_idle",
  "down_walk",
  "side_idle",
  "side_walk",
  "up_idle",
  "up_walk",
] as const;

export type CharacterAnimationRowName = (typeof CHARACTER_ANIMATION_ROWS)[number];

type FrameRect = Readonly<{
  x: number;
  y: number;
  w: number;
  h: number;
}>;

type AnimationRow = Readonly<{
  row: number;
  frames: number;
  fps: number;
  durations_ms: readonly number[];
  loop: boolean;
  frame_variant: string;
}>;

export type CharacterAnimationManifest = Readonly<{
  characterId: string;
  game_input: "sprite-sheet-alpha.png";
  degraded_static_fallback: false;
  animation: Readonly<{
    cellWidth: number;
    cellHeight: number;
    columns: number;
    rows: Readonly<Record<CharacterAnimationRowName, AnimationRow>>;
  }>;
  frame_layout: Readonly<{
    sheetWidth: number;
    sheetHeight: number;
    cellWidth: number;
    cellHeight: number;
    rows: Readonly<Record<CharacterAnimationRowName, readonly FrameRect[]>>;
  }>;
}>;

export class CharacterAnimationManifestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CharacterAnimationManifestError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function positiveInteger(value: unknown) {
  return Number.isInteger(value) && Number(value) > 0;
}

export function validateCharacterAnimationManifest(value: unknown): CharacterAnimationManifest {
  const issues: string[] = [];
  if (!isRecord(value)) {
    throw new CharacterAnimationManifestError("character animation manifest must be an object");
  }

  if (typeof value.characterId !== "string" || !value.characterId) {
    issues.push("characterId must be a non-empty string");
  }
  if (value.game_input !== "sprite-sheet-alpha.png") {
    issues.push("game_input must point to sprite-sheet-alpha.png");
  }
  if (value.degraded_static_fallback !== false) {
    issues.push("degraded_static_fallback must be false");
  }

  const animation = isRecord(value.animation) ? value.animation : null;
  const layout = isRecord(value.frame_layout) ? value.frame_layout : null;
  if (!animation) issues.push("animation must be an object");
  if (!layout) issues.push("frame_layout must be an object");

  const animationRows = animation && isRecord(animation.rows) ? animation.rows : null;
  const layoutRows = layout && isRecord(layout.rows) ? layout.rows : null;
  if (!animationRows) issues.push("animation.rows must be an object");
  if (!layoutRows) issues.push("frame_layout.rows must be an object");

  const sheetWidth = layout?.sheetWidth;
  const sheetHeight = layout?.sheetHeight;
  const cellWidth = layout?.cellWidth;
  const cellHeight = layout?.cellHeight;
  if (!positiveInteger(sheetWidth) || !positiveInteger(sheetHeight)) {
    issues.push("frame_layout sheet dimensions must be positive integers");
  }
  if (!positiveInteger(cellWidth) || !positiveInteger(cellHeight)) {
    issues.push("frame_layout cell dimensions must be positive integers");
  }
  if (
    animation
    && (animation.cellWidth !== cellWidth || animation.cellHeight !== cellHeight)
  ) {
    issues.push("animation and frame_layout cell dimensions must match");
  }

  for (const rowName of CHARACTER_ANIMATION_ROWS) {
    const row = animationRows && isRecord(animationRows[rowName]) ? animationRows[rowName] : null;
    const rects = layoutRows?.[rowName];
    if (!row) {
      issues.push(`animation row ${rowName} is required`);
      continue;
    }
    if (!Array.isArray(rects) || rects.length === 0) {
      issues.push(`frame_layout row ${rowName} must contain frames`);
      continue;
    }
    if (!positiveInteger(row.frames) || row.frames !== rects.length) {
      issues.push(`animation row ${rowName} frame count must match frame_layout`);
    }
    if (!positiveInteger(row.fps) || row.loop !== true) {
      issues.push(`animation row ${rowName} requires a positive fps and loop=true`);
    }
    if (
      !Array.isArray(row.durations_ms)
      || row.durations_ms.length !== rects.length
      || row.durations_ms.some((duration) => typeof duration !== "number" || duration <= 0)
    ) {
      issues.push(`animation row ${rowName} requires one positive duration per frame`);
    }

    rects.forEach((rect, frameIndex) => {
      if (
        !isRecord(rect)
        || !Number.isInteger(rect.x)
        || !Number.isInteger(rect.y)
        || !positiveInteger(rect.w)
        || !positiveInteger(rect.h)
      ) {
        issues.push(`frame_layout ${rowName}[${frameIndex}] must be an integer rectangle`);
        return;
      }
      if (
        typeof sheetWidth === "number"
        && typeof sheetHeight === "number"
        && (
          Number(rect.x) < 0
          || Number(rect.y) < 0
          || Number(rect.x) + Number(rect.w) > sheetWidth
          || Number(rect.y) + Number(rect.h) > sheetHeight
        )
      ) {
        issues.push(`frame_layout ${rowName}[${frameIndex}] exceeds the sprite sheet`);
      }
    });
  }

  if (issues.length) throw new CharacterAnimationManifestError(issues.join("; "));
  return value as CharacterAnimationManifest;
}

export function selectCharacterAnimationRow(
  facing: MovementFacing,
  walking: boolean,
  reducedMotion = false,
): CharacterAnimationRowName {
  const motion = walking && !reducedMotion ? "walk" : "idle";
  if (facing === "north") return `up_${motion}`;
  if (facing === "east" || facing === "west") return `side_${motion}`;
  return `down_${motion}`;
}

export function characterFrameIndex(
  manifest: CharacterAnimationManifest,
  rowName: CharacterAnimationRowName,
  elapsedMs: number,
) {
  const durations = manifest.animation.rows[rowName].durations_ms;
  const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
  let cursor = Math.max(0, elapsedMs) % totalDuration;
  for (let index = 0; index < durations.length; index += 1) {
    if (cursor < durations[index]) return index;
    cursor -= durations[index];
  }
  return durations.length - 1;
}

export type CharacterAnimator = {
  readonly sprite: Sprite;
  readonly manifest: CharacterAnimationManifest;
  readonly textures: Readonly<Record<CharacterAnimationRowName, readonly Texture[]>>;
  activeRow: CharacterAnimationRowName;
  elapsedMs: number;
  destroy: () => void;
};

export function createCharacterAnimator(
  sprite: Sprite,
  atlasTexture: Texture,
  manifest: CharacterAnimationManifest,
): CharacterAnimator {
  const textureCache = new Map<string, Texture>();
  const rows = {} as Record<CharacterAnimationRowName, readonly Texture[]>;

  for (const rowName of CHARACTER_ANIMATION_ROWS) {
    rows[rowName] = manifest.frame_layout.rows[rowName].map((rect) => {
      const key = `${rect.x}:${rect.y}:${rect.w}:${rect.h}`;
      const existing = textureCache.get(key);
      if (existing) return existing;
      const texture = new Texture({
        source: atlasTexture.source,
        frame: new Rectangle(rect.x, rect.y, rect.w, rect.h),
        label: `${manifest.characterId}:${rowName}:${key}`,
      });
      textureCache.set(key, texture);
      return texture;
    });
  }

  const activeRow: CharacterAnimationRowName = "down_idle";
  sprite.texture = rows[activeRow][0];
  return {
    sprite,
    manifest,
    textures: rows,
    activeRow,
    elapsedMs: 0,
    destroy: () => {
      for (const texture of textureCache.values()) texture.destroy(false);
      textureCache.clear();
    },
  };
}

export function updateCharacterAnimator(
  animator: CharacterAnimator,
  facing: MovementFacing,
  walking: boolean,
  deltaMs: number,
  reducedMotion = false,
) {
  const nextRow = selectCharacterAnimationRow(facing, walking, reducedMotion);
  if (nextRow !== animator.activeRow) {
    animator.activeRow = nextRow;
    animator.elapsedMs = 0;
  } else {
    animator.elapsedMs += Math.max(0, deltaMs);
  }
  const frameIndex = characterFrameIndex(animator.manifest, nextRow, animator.elapsedMs);
  animator.sprite.texture = animator.textures[nextRow][frameIndex];
}
