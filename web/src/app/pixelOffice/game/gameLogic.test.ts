import { describe, expect, it } from "vitest";
import {
  AssetManifestError,
  CLASSIC_ASSET_MANIFEST,
  validateAssetManifest,
} from "./assetManifest";
import { CLASSIC_SCENE_MANIFEST } from "./classicScene";
import {
  CHARACTER_ANIMATION_ROWS,
  CharacterAnimationManifestError,
  characterFrameIndex,
  selectCharacterAnimationRow,
  validateCharacterAnimationManifest,
} from "./characterAnimation";
import { depthFromFootPoint } from "./depthSort";
import {
  advanceMovement,
  createMovementState,
  requestMovement,
} from "./movementMachine";
import { assertStronglyConnected, findAuthoredRoute } from "./routeGraph";
import { SceneManifestError, validateSceneManifest } from "./sceneManifest";

describe("Classic scene manifest", () => {
  it("contains one valid definition for every semantic anchor", () => {
    expect(validateSceneManifest(CLASSIC_SCENE_MANIFEST)).toBe(CLASSIC_SCENE_MANIFEST);
    expect(CLASSIC_SCENE_MANIFEST.anchors).toHaveLength(7);
  });

  it("rejects an anchor that drifts away from its route node", () => {
    const broken = {
      ...CLASSIC_SCENE_MANIFEST,
      anchors: CLASSIC_SCENE_MANIFEST.anchors.map((anchor) => (
        anchor.id === "news_desk"
          ? { ...anchor, position: { x: anchor.position.x + 1, y: anchor.position.y } }
          : anchor
      )),
    };
    expect(() => validateSceneManifest(broken)).toThrow(SceneManifestError);
  });

  it("rejects duplicate route edges", () => {
    const broken = {
      ...CLASSIC_SCENE_MANIFEST,
      routeEdges: [...CLASSIC_SCENE_MANIFEST.routeEdges, CLASSIC_SCENE_MANIFEST.routeEdges[0]],
    };
    expect(() => validateSceneManifest(broken)).toThrow(/duplicated/);
  });
});

describe("Classic asset manifest", () => {
  it("accepts one shell, all semantic scene objects, a neutral fallback, and one character atlas", () => {
    expect(validateAssetManifest(CLASSIC_ASSET_MANIFEST)).toBe(CLASSIC_ASSET_MANIFEST);
    const sceneObjects = CLASSIC_ASSET_MANIFEST.assets.filter((asset) => asset.role === "scene_object");
    expect(sceneObjects).toHaveLength(10);
    expect(new Set(sceneObjects.map((asset) => asset.objectId))).toEqual(new Set([
      "news_desk",
      "market_board",
      "research_desk",
      "report_shelf",
      "memo_board",
      "portfolio_monitor",
      "agent_seat",
    ]));
    expect(CLASSIC_ASSET_MANIFEST.assets.filter((asset) => asset.role === "character_atlas")).toHaveLength(1);
  });

  it("rejects duplicate asset ids", () => {
    const broken = {
      ...CLASSIC_ASSET_MANIFEST,
      assets: [...CLASSIC_ASSET_MANIFEST.assets, CLASSIC_ASSET_MANIFEST.assets[0]],
    };
    expect(() => validateAssetManifest(broken)).toThrow(AssetManifestError);
  });
});

function animationManifestFixture() {
  const rows = Object.fromEntries(CHARACTER_ANIMATION_ROWS.map((rowName, row) => [
    rowName,
    {
      row,
      frames: 2,
      fps: 6,
      durations_ms: rowName === "side_walk" ? [100, 200] : [125, 125],
      loop: true,
      frame_variant: "pixel",
    },
  ]));
  const layoutRows = Object.fromEntries(CHARACTER_ANIMATION_ROWS.map((rowName, row) => [
    rowName,
    [
      { x: 0, y: row * 96, w: 64, h: 96 },
      { x: 64, y: row * 96, w: 64, h: 96 },
    ],
  ]));
  return {
    characterId: "classic-analyst",
    game_input: "sprite-sheet-alpha.png",
    degraded_static_fallback: false,
    animation: {
      cellWidth: 64,
      cellHeight: 96,
      columns: 2,
      rows,
    },
    frame_layout: {
      sheetWidth: 128,
      sheetHeight: 576,
      cellWidth: 64,
      cellHeight: 96,
      rows: layoutRows,
    },
  };
}

describe("Character animation manifest", () => {
  it("validates explicit frame-layout rows and duration timing", () => {
    const manifest = validateCharacterAnimationManifest(animationManifestFixture());
    expect(characterFrameIndex(manifest, "side_walk", 0)).toBe(0);
    expect(characterFrameIndex(manifest, "side_walk", 99)).toBe(0);
    expect(characterFrameIndex(manifest, "side_walk", 100)).toBe(1);
    expect(characterFrameIndex(manifest, "side_walk", 300)).toBe(0);
  });

  it("maps movement direction to authored rows and suppresses walk cycles for reduced motion", () => {
    expect(selectCharacterAnimationRow("south", true)).toBe("down_walk");
    expect(selectCharacterAnimationRow("north", false)).toBe("up_idle");
    expect(selectCharacterAnimationRow("east", true)).toBe("side_walk");
    expect(selectCharacterAnimationRow("west", true)).toBe("side_walk");
    expect(selectCharacterAnimationRow("east", true, true)).toBe("side_idle");
  });

  it("rejects a degraded static fallback masquerading as an animation atlas", () => {
    const broken = {
      ...animationManifestFixture(),
      degraded_static_fallback: true,
    };
    expect(() => validateCharacterAnimationManifest(broken)).toThrow(CharacterAnimationManifestError);
  });
});

describe("Authored route graph", () => {
  it("is strongly connected and passes through authored hubs", () => {
    expect(assertStronglyConnected(CLASSIC_SCENE_MANIFEST)).toBe(true);
    const route = findAuthoredRoute(CLASSIC_SCENE_MANIFEST, "news_desk", "portfolio_monitor");
    expect(route.nodes).toEqual([
      "news_desk",
      "north_hub",
      "room_hub",
      "south_hub",
      "portfolio_monitor",
    ]);
  });
});

describe("Movement state machine", () => {
  it("walks the complete route and settles into the requested work state", () => {
    let state = createMovementState(CLASSIC_SCENE_MANIFEST);
    state = requestMovement(state, "news_desk", "working");
    expect(state.phase).toBe("route_pending");
    for (let step = 0; step < 200 && state.phase !== "working"; step += 1) {
      state = advanceMovement(state, CLASSIC_SCENE_MANIFEST, 1 / 30, 96);
    }
    expect(state.phase).toBe("working");
    expect(state.currentNode).toBe("news_desk");
    expect(state.position).toEqual(CLASSIC_SCENE_MANIFEST.routeNodes.news_desk);
  });

  it("queues a changed destination without teleporting mid-route", () => {
    let state = createMovementState(CLASSIC_SCENE_MANIFEST);
    state = advanceMovement(
      requestMovement(state, "news_desk", "working"),
      CLASSIC_SCENE_MANIFEST,
      1 / 60,
    );
    const before = state.position;
    state = requestMovement(state, "report_shelf", "complete");
    expect(state.requestedNode).toBe("report_shelf");
    expect(state.position).toBe(before);
  });
});

describe("Depth sorting", () => {
  it("places the object with the lower foot point in front", () => {
    expect(depthFromFootPoint(240)).toBeGreaterThan(depthFromFootPoint(120));
    expect(depthFromFootPoint(240, 3)).toBe(depthFromFootPoint(240) + 3);
  });
});
