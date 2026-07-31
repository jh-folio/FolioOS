import { Container, Graphics, Sprite } from "pixi.js";
import type { OfficeObjectId, OfficeObjectState } from "../types";
import type { ClassicRoomAssets } from "./assetLoader";
import {
  createCharacterAnimator,
  type CharacterAnimator,
} from "./characterAnimation";
import { depthFromFootPoint } from "./depthSort";
import type { PixelOfficeSceneManifest, SceneObjectStatus } from "./sceneTypes";

const MIDNIGHT = 0x111b2d;

export type ClassicRoomRuntime = Readonly<{
  world: Container;
  agent: Container;
  characterAnimator: CharacterAnimator;
  objectSprites: ReadonlyMap<OfficeObjectId, readonly Sprite[]>;
  statusIndicators: ReadonlyMap<OfficeObjectId, Graphics>;
}>;

function statusColor(state: OfficeObjectState) {
  if (state === "error" || state === "unavailable") return 0xd66c5e;
  if (state === "attention" || state === "stale") return 0xf0ce75;
  if (state === "busy" || state === "loading") return 0x66a8c4;
  if (state === "empty") return 0x8b8f99;
  return 0x63b58b;
}

export function renderStatusIndicators(
  indicators: ReadonlyMap<OfficeObjectId, Graphics>,
  statuses: SceneObjectStatus,
) {
  for (const [id, indicator] of indicators) {
    indicator.clear();
    indicator.circle(0, 0, 4).fill(statusColor(statuses[id])).stroke({ color: MIDNIGHT, width: 1 });
  }
}

export function createClassicRoomRuntime(
  manifest: PixelOfficeSceneManifest,
  statuses: SceneObjectStatus,
  assets: ClassicRoomAssets,
): ClassicRoomRuntime {
  const world = new Container();
  world.sortableChildren = true;

  const base = new Sprite(assets.roomBase.texture);
  base.width = manifest.logicalSize.width;
  base.height = manifest.logicalSize.height;
  base.zIndex = assets.roomBase.definition.depth || 0;
  world.addChild(base);

  const indicators = new Map<OfficeObjectId, Graphics>();
  for (const anchor of manifest.anchors) {
    const indicator = new Graphics();
    indicator.x = anchor.hitArea.x + anchor.hitArea.width - 9;
    indicator.y = anchor.hitArea.y + 9;
    indicator.zIndex = depthFromFootPoint(anchor.occlusionBounds.y + anchor.occlusionBounds.height, 40);
    indicators.set(anchor.id, indicator);
    world.addChild(indicator);
  }
  renderStatusIndicators(indicators, statuses);

  const agent = new Container();
  const character = new Sprite(assets.characterIdle.texture);
  character.anchor.set(0.5, 1);
  const characterAnimator = createCharacterAnimator(
    character,
    assets.characterAtlas.texture,
    assets.characterAnimation,
  );
  agent.addChild(character);
  const spawn = manifest.routeNodes[manifest.spawnNode];
  agent.x = spawn.x;
  agent.y = spawn.y;
  agent.zIndex = depthFromFootPoint(spawn.y, 10);
  world.addChild(agent);

  const objectSprites = new Map<OfficeObjectId, Sprite[]>();
  for (const sceneObject of assets.sceneObjects) {
    const objectId = sceneObject.definition.objectId;
    if (!objectId) continue;
    const sprite = new Sprite(sceneObject.texture);
    sprite.width = manifest.logicalSize.width;
    sprite.height = manifest.logicalSize.height;
    sprite.zIndex = sceneObject.definition.depth || 0;
    const siblings = objectSprites.get(objectId) || [];
    siblings.push(sprite);
    objectSprites.set(objectId, siblings);
    world.addChild(sprite);
  }

  return {
    world,
    agent,
    characterAnimator,
    objectSprites,
    statusIndicators: indicators,
  };
}
