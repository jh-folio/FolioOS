import type { OfficeObjectId, OfficeObjectState } from "../types";

export type ScenePoint = Readonly<{
  x: number;
  y: number;
}>;

export type SceneRect = ScenePoint & Readonly<{
  width: number;
  height: number;
}>;

export type RouteNodeId = OfficeObjectId | "room_hub" | "north_hub" | "south_hub";

export type SceneAnchor = Readonly<{
  id: OfficeObjectId;
  position: ScenePoint;
  hitArea: SceneRect;
  collisionBounds: SceneRect;
  occlusionBounds: SceneRect;
  labelPlacement: "above" | "below";
}>;

export type RouteEdge = readonly [RouteNodeId, RouteNodeId];

export type PixelOfficeSceneManifest = Readonly<{
  version: 1;
  sceneId: "classic_analyst";
  logicalSize: Readonly<{ width: number; height: number }>;
  tileSize: 16;
  spawnNode: OfficeObjectId;
  routeNodes: Readonly<Record<RouteNodeId, ScenePoint>>;
  routeEdges: readonly RouteEdge[];
  anchors: readonly SceneAnchor[];
}>;

export type SceneObjectStatus = Readonly<Record<OfficeObjectId, OfficeObjectState>>;

export const OFFICE_OBJECT_IDS = [
  "news_desk",
  "market_board",
  "research_desk",
  "report_shelf",
  "memo_board",
  "portfolio_monitor",
  "agent_seat",
] as const satisfies readonly OfficeObjectId[];
