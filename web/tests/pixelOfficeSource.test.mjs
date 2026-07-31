import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const root = new URL("../src/app/", import.meta.url);
const route = fs.readFileSync(new URL("PixelOfficeRoute.tsx", root), "utf8");
const registry = fs.readFileSync(new URL("pixelOffice/officeObjects.ts", root), "utf8");
const hook = fs.readFileSync(new URL("pixelOffice/usePixelOffice.ts", root), "utf8");
const scene = fs.readFileSync(new URL("pixelOffice/PixelOfficeScene.tsx", root), "utf8");
const object = fs.readFileSync(new URL("pixelOffice/OfficeObject.tsx", root), "utf8");
const panel = fs.readFileSync(new URL("pixelOffice/OfficeDetailPanel.tsx", root), "utf8");
const mobile = fs.readFileSync(new URL("pixelOffice/MobileOfficeCards.tsx", root), "utf8");
const activity = fs.readFileSync(new URL("pixelOffice/activityState.ts", root), "utf8");
const activityHook = fs.readFileSync(new URL("pixelOffice/useAgentActivity.ts", root), "utf8");
const attention = fs.readFileSync(new URL("pixelOffice/useAgentAttention.ts", root), "utf8");
const character = fs.readFileSync(new URL("pixelOffice/AgentCharacter.tsx", root), "utf8");
const presets = fs.readFileSync(new URL("pixelOffice/characterPresets.ts", root), "utf8");
const gameScene = fs.readFileSync(new URL("pixelOffice/game/PixelOfficeGameScene.tsx", root), "utf8");
const canvas = fs.readFileSync(new URL("pixelOffice/game/PixelOfficeCanvas.tsx", root), "utf8");
const characterAnimation = fs.readFileSync(new URL("pixelOffice/game/characterAnimation.ts", root), "utf8");
const assetLoader = fs.readFileSync(new URL("pixelOffice/game/assetLoader.ts", root), "utf8");
const assetManifestSource = fs.readFileSync(new URL("pixelOffice/game/assetManifest.ts", root), "utf8");
const semanticOverlay = fs.readFileSync(new URL("pixelOffice/game/PixelOfficeSemanticOverlay.tsx", root), "utf8");
const manifest = fs.readFileSync(new URL("pixelOffice/game/classicScene.ts", root), "utf8");
const runtimeCharacterManifest = JSON.parse(fs.readFileSync(
  new URL("../../public/pixel-office/characters/classic/manifest.json", import.meta.url),
  "utf8",
));

test("Pixel Office registry maps every backend object to a real route and panel", () => {
  for (const id of [
    "news_desk",
    "market_board",
    "research_desk",
    "report_shelf",
    "memo_board",
    "portfolio_monitor",
    "agent_seat",
  ]) {
    assert.match(registry, new RegExp(`id: "${id}"`));
  }
  assert.match(registry, /route: "#\/rss"/);
  assert.match(registry, /route: "#\/market-memory"/);
  assert.match(registry, /panel: "agent"/);
});

test("Pixel Office owns bounded visible polling and whole-API fallback", () => {
  assert.match(hook, /\/api\/pixel-office/);
  assert.match(hook, /\/api\/jobs/);
  assert.match(hook, /document\.visibilityState/);
  assert.match(hook, /hasActiveJob \? 2500 : 15000/);
  assert.match(hook, /window\.setInterval\(refresh, 60000\)/);
  assert.match(hook, /fallbackOfficeObjects/);
});

test("Pixel Office uses semantic object buttons and accessible detail/mobile alternatives", () => {
  assert.match(scene, /aria-label="Pixel Office 업무 공간"/);
  assert.match(object, /<button/);
  assert.match(object, /aria-label=/);
  assert.match(panel, /role="dialog"/);
  assert.match(panel, /aria-modal="true"/);
  assert.match(panel, /event\.key === "Escape"/);
  assert.match(panel, /returnFocusRef/);
  assert.match(mobile, /aria-label="Office 상태 목록"/);
  assert.match(route, /useAgentWorkspace\("pixel_office"\)/);
});

test("Pixel Office exposes only the two 0.3.0 character presets with asset fallback", () => {
  assert.match(presets, /id: "classic"/);
  assert.match(presets, /id: "student"/);
  assert.match(presets, /\/pixel-office\/characters\/classic\.png/);
  assert.match(presets, /\/pixel-office\/characters\/student\.png/);
  assert.doesNotMatch(presets, /modern|cozy/);
  assert.match(character, /onError=\{\(\) => setAssetFailed\(true\)\}/);
  assert.match(character, /agent-character-fallback/);
});

test("Agent activity follows job priority, bounded ambient motion, and known work anchors", () => {
  assert.match(activity, /status === "failed"/);
  assert.match(activity, /status === "running"/);
  assert.match(activity, /status === "queued"/);
  assert.match(activity, /anchor: "news_desk"/);
  assert.match(activity, /anchor: "research_desk"/);
  assert.match(activity, /anchor: "report_shelf"/);
  assert.match(activity, /generic_work/);
  assert.match(activityHook, /motion === "reduced"/);
  assert.match(activityHook, /document\.visibilityState === "hidden"/);
  assert.match(activityHook, /12000/);
});

test("Terminal jobs and pending proposals become persistent acknowledgeable attention", () => {
  assert.match(attention, /folio\.pixelOffice\.attention\.v1/);
  assert.match(attention, /\["done", "failed"\]/);
  assert.match(attention, /proposalStatus === "pending"/);
  assert.match(attention, /localStorage\.setItem/);
  assert.match(route, /<AgentAttentionBar/);
  assert.match(route, /characterAnchor=\{activity\.anchor\}/);
});

test("Pixel Office lazy-loads the Pixi game scene behind the preserved CSS fallback", () => {
  assert.match(route, /lazy\(\(\) => import\("\.\/pixelOffice\/game\/PixelOfficeGameScene"\)/);
  assert.match(route, /<PixelOfficeSceneBoundary fallback=\{legacyScene\}>/);
  assert.match(route, /<Suspense fallback=\{legacyScene\}>/);
  assert.match(gameScene, /data-renderer="pixi"/);
  assert.match(gameScene, /data-renderer="css"/);
});

test("Pixi scene owns lifecycle, nearest scaling, authored movement, and semantic DOM actions", () => {
  assert.match(canvas, /new Application\(\)/);
  assert.match(canvas, /TextureStyle\.defaultOptions\.scaleMode = "nearest"/);
  assert.match(canvas, /document\.visibilityState === "hidden"/);
  assert.match(canvas, /app\.destroy\(\{ removeView: true \}, \{ children: true \}\)/);
  assert.match(canvas, /advanceMovement/);
  assert.match(canvas, /updateCharacterAnimator/);
  assert.doesNotMatch(canvas, /Math\.sin/);
  assert.match(semanticOverlay, /<button/);
  assert.match(semanticOverlay, /data-office-object=/);
  assert.match(semanticOverlay, /aria-pressed=/);
  for (const id of [
    "news_desk",
    "market_board",
    "research_desk",
    "report_shelf",
    "memo_board",
    "portfolio_monitor",
    "agent_seat",
  ]) {
    assert.match(manifest, new RegExp(`${id}: \\{ x:`));
  }
});

test("Pixi character animation consumes the official sprite-gen frame layout", () => {
  assert.match(assetManifestSource, /\/pixel-office\/characters\/classic\/manifest\.json/);
  assert.match(assetLoader, /validateCharacterAnimationManifest/);
  assert.match(characterAnimation, /frame_layout/);
  assert.match(characterAnimation, /durations_ms/);
  assert.match(characterAnimation, /selectCharacterAnimationRow/);
  assert.equal(runtimeCharacterManifest.game_input, "sprite-sheet-alpha.png");
  assert.equal(runtimeCharacterManifest.degraded_static_fallback, false);
  assert.deepEqual(
    Object.keys(runtimeCharacterManifest.frame_layout.rows),
    ["down_idle", "down_walk", "side_idle", "side_walk", "up_idle", "up_walk"],
  );
  assert.equal(runtimeCharacterManifest.frame_layout.rows.side_walk.length, 4);
});

test("Pixi room renders every semantic office item as a separately owned scene object", () => {
  assert.match(assetManifestSource, /role: "scene_object"/);
  assert.match(assetManifestSource, /room-shell-modern-v2\.png/);
  for (const id of [
    "news_desk",
    "market_board",
    "research_desk",
    "report_shelf",
    "memo_board",
    "portfolio_monitor",
    "agent_seat",
  ]) {
    assert.match(assetManifestSource, new RegExp(`objectId: "${id}"`));
  }
});
