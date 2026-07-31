import { Assets, type Texture } from "pixi.js";
import {
  CLASSIC_ASSET_MANIFEST,
  CLASSIC_CHARACTER_ANIMATION_MANIFEST_SRC,
  validateAssetManifest,
  type PixelAssetDefinition,
} from "./assetManifest";
import {
  validateCharacterAnimationManifest,
  type CharacterAnimationManifest,
} from "./characterAnimation";

export type LoadedPixelAsset = Readonly<{
  definition: PixelAssetDefinition;
  texture: Texture;
}>;

export type ClassicRoomAssets = Readonly<{
  roomBase: LoadedPixelAsset;
  sceneObjects: readonly LoadedPixelAsset[];
  characterIdle: LoadedPixelAsset;
  characterAtlas: LoadedPixelAsset;
  characterAnimation: CharacterAnimationManifest;
}>;

export async function loadClassicRoomAssets(): Promise<ClassicRoomAssets> {
  const manifest = validateAssetManifest(CLASSIC_ASSET_MANIFEST);
  const runtimeDefinitions = manifest.assets.filter((definition) => definition.role !== "portrait");
  const [loaded, animationResponse] = await Promise.all([
    Promise.all(runtimeDefinitions.map(async (definition) => ({
      definition,
      texture: await Assets.load<Texture>(definition.src),
    }))),
    fetch(CLASSIC_CHARACTER_ANIMATION_MANIFEST_SRC),
  ]);
  if (!animationResponse.ok) {
    throw new Error(`Classic character animation manifest failed to load (${animationResponse.status})`);
  }
  const characterAnimation = validateCharacterAnimationManifest(await animationResponse.json());
  const roomBase = loaded.find((item) => item.definition.role === "room_base");
  const characterIdle = loaded.find((item) => item.definition.role === "character_idle");
  const characterAtlas = loaded.find((item) => item.definition.role === "character_atlas");
  if (!roomBase || !characterIdle || !characterAtlas) {
    throw new Error("Classic room asset roles are incomplete");
  }
  if (
    characterAnimation.frame_layout.sheetWidth !== characterAtlas.definition.width
    || characterAnimation.frame_layout.sheetHeight !== characterAtlas.definition.height
  ) {
    throw new Error("Classic character atlas dimensions do not match its animation manifest");
  }
  return {
    roomBase,
    characterIdle,
    characterAtlas,
    characterAnimation,
    sceneObjects: loaded.filter((item) => item.definition.role === "scene_object"),
  };
}
