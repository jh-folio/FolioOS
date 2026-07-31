import type { OfficeObjectId } from "../types";
import { OFFICE_OBJECT_IDS } from "./sceneTypes";

export type PixelAssetRole =
  | "room_base"
  | "scene_object"
  | "character_idle"
  | "character_atlas"
  | "portrait";

export type PixelAssetDefinition = Readonly<{
  id: string;
  role: PixelAssetRole;
  src: string;
  width: number;
  height: number;
  depth?: number;
  objectId?: OfficeObjectId;
}>;

export type PixelAssetManifest = Readonly<{
  version: 1;
  sceneId: "classic_analyst";
  assets: readonly PixelAssetDefinition[];
}>;

export const CLASSIC_ASSET_MANIFEST = {
  version: 1,
  sceneId: "classic_analyst",
  assets: [
    {
      id: "classic_room_base",
      role: "room_base",
      src: "/pixel-office/scenes/classic/room-shell-modern-v2.png",
      width: 560,
      height: 315,
      depth: 0,
    },
    {
      id: "classic_agent_seat_rug_object",
      role: "scene_object",
      src: "/pixel-office/scenes/classic/object-agent-seat-rug-v2.png",
      width: 560,
      height: 315,
      depth: 200,
      objectId: "agent_seat",
    },
    {
      id: "classic_market_board_object",
      role: "scene_object",
      src: "/pixel-office/scenes/classic/object-market-board-v2.png",
      width: 560,
      height: 315,
      depth: 11800,
      objectId: "market_board",
    },
    {
      id: "classic_news_desk_workstation_object",
      role: "scene_object",
      src: "/pixel-office/scenes/classic/object-news-desk-v2.png",
      width: 560,
      height: 315,
      depth: 15900,
      objectId: "news_desk",
    },
    {
      id: "classic_research_desk_workstation_object",
      role: "scene_object",
      src: "/pixel-office/scenes/classic/object-research-desk-v2.png",
      width: 560,
      height: 315,
      depth: 19100,
      objectId: "research_desk",
    },
    {
      id: "classic_news_desk_chair_object",
      role: "scene_object",
      src: "/pixel-office/scenes/classic/object-news-desk-chair-v2.png",
      width: 560,
      height: 315,
      depth: 21200,
      objectId: "news_desk",
    },
    {
      id: "classic_memo_board_object",
      role: "scene_object",
      src: "/pixel-office/scenes/classic/object-memo-board-v2.png",
      width: 560,
      height: 315,
      depth: 22300,
      objectId: "memo_board",
    },
    {
      id: "classic_report_shelf_object",
      role: "scene_object",
      src: "/pixel-office/scenes/classic/object-report-shelf-v2.png",
      width: 560,
      height: 315,
      depth: 22500,
      objectId: "report_shelf",
    },
    {
      id: "classic_research_desk_chair_object",
      role: "scene_object",
      src: "/pixel-office/scenes/classic/object-research-desk-chair-v2.png",
      width: 560,
      height: 315,
      depth: 23800,
      objectId: "research_desk",
    },
    {
      id: "classic_agent_seat_chair_object",
      role: "scene_object",
      src: "/pixel-office/scenes/classic/object-agent-seat-chair-v2.png",
      width: 560,
      height: 315,
      depth: 27800,
      objectId: "agent_seat",
    },
    {
      id: "classic_agent_seat_side_table_object",
      role: "scene_object",
      src: "/pixel-office/scenes/classic/object-agent-seat-side-table-v2.png",
      width: 560,
      height: 315,
      depth: 27900,
      objectId: "agent_seat",
    },
    {
      id: "classic_portfolio_workstation_object",
      role: "scene_object",
      src: "/pixel-office/scenes/classic/object-portfolio-monitor-v2.png",
      width: 560,
      height: 315,
      depth: 28700,
      objectId: "portfolio_monitor",
    },
    {
      id: "classic_agent_seat_coffee_table_object",
      role: "scene_object",
      src: "/pixel-office/scenes/classic/object-agent-seat-coffee-table-v2.png",
      width: 560,
      height: 315,
      depth: 30200,
      objectId: "agent_seat",
    },
    {
      id: "classic_portfolio_chair_object",
      role: "scene_object",
      src: "/pixel-office/scenes/classic/object-portfolio-chair-v2.png",
      width: 560,
      height: 315,
      depth: 31300,
      objectId: "portfolio_monitor",
    },
    {
      id: "classic_neutral_front",
      role: "character_idle",
      src: "/pixel-office/characters/classic/neutral-front-v3.png",
      width: 64,
      height: 96,
    },
    {
      id: "classic_character_atlas",
      role: "character_atlas",
      src: "/pixel-office/characters/classic/sprite-sheet-alpha.png",
      width: 256,
      height: 576,
    },
    {
      id: "classic_portrait",
      role: "portrait",
      src: "/pixel-office/characters/classic/portrait.png",
      width: 234,
      height: 290,
    },
  ],
} as const satisfies PixelAssetManifest;

export const CLASSIC_CHARACTER_ANIMATION_MANIFEST_SRC =
  "/pixel-office/characters/classic/manifest.json";

export class AssetManifestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssetManifestError";
  }
}

export function validateAssetManifest(manifest: PixelAssetManifest) {
  const issues: string[] = [];
  const ids = new Set<string>();
  let baseCount = 0;
  let idleCount = 0;
  let atlasCount = 0;
  const objectIds = new Set<OfficeObjectId>();
  for (const asset of manifest.assets) {
    if (!asset.id || ids.has(asset.id)) issues.push(`asset id ${asset.id || "<empty>"} must be unique`);
    ids.add(asset.id);
    if (!asset.src.startsWith("/pixel-office/") || !asset.src.endsWith(".png")) {
      issues.push(`asset ${asset.id} must use a project-bound PNG path`);
    }
    if (!Number.isInteger(asset.width) || asset.width <= 0 || !Number.isInteger(asset.height) || asset.height <= 0) {
      issues.push(`asset ${asset.id} dimensions must be positive integers`);
    }
    if (asset.role === "room_base") baseCount += 1;
    if (asset.role === "character_idle") idleCount += 1;
    if (asset.role === "character_atlas") atlasCount += 1;
    if (asset.role === "scene_object") {
      if (!asset.objectId || !OFFICE_OBJECT_IDS.includes(asset.objectId)) {
        issues.push(`scene object ${asset.id} requires a known objectId`);
      } else {
        objectIds.add(asset.objectId);
      }
      if (!Number.isFinite(asset.depth)) {
        issues.push(`scene object ${asset.id} requires a finite depth`);
      }
    }
  }
  if (baseCount !== 1) issues.push("asset manifest requires exactly one room_base");
  if (idleCount !== 1) issues.push("asset manifest requires exactly one character_idle");
  if (atlasCount !== 1) issues.push("asset manifest requires exactly one character_atlas");
  for (const objectId of OFFICE_OBJECT_IDS) {
    if (!objectIds.has(objectId)) issues.push(`scene object ${objectId} requires at least one asset`);
  }
  if (issues.length) throw new AssetManifestError(issues.join("; "));
  return manifest;
}
