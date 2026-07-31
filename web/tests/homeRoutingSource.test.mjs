import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const preferences = fs.readFileSync(new URL("../src/app/homePreference.ts", import.meta.url), "utf8");
const routes = fs.readFileSync(new URL("../src/app/routes.ts", import.meta.url), "utf8");
const shell = fs.readFileSync(new URL("../src/app/AppShell.tsx", import.meta.url), "utf8");
const chooser = fs.readFileSync(new URL("../src/app/HomeModeChooser.tsx", import.meta.url), "utf8");
const settings = fs.readFileSync(new URL("../src/app/SettingsRoute.tsx", import.meta.url), "utf8");

test("Home preference uses versioned guarded storage defaults", () => {
  assert.match(preferences, /folio\.homePreference\.v1/);
  assert.match(preferences, /folio\.agentCharacter\.v1/);
  assert.match(preferences, /folio\.motionPreference\.v1/);
  assert.match(preferences, /mode: home\.mode === "home" \? "home" : "office"/);
  assert.match(preferences, /choiceSeen: home\.choiceSeen === true/);
  assert.match(preferences, /preset: character\.preset === "student" \? "student" : "classic"/);
  assert.match(preferences, /motion === "reduced" \? "reduced" : "system"/);
});

test("AppShell adds office while preserving explicit deep links", () => {
  assert.match(routes, /\| "office"/);
  assert.match(routes, /const DEFAULT_ROUTE: RouteId = "office"/);
  assert.match(shell, /window\.location\.hash \|\| toHash\(preferredHomeRoute\(\)\)/);
  assert.match(shell, /<PixelOfficeRoute \/>/);
  assert.match(shell, /<HomeModeChooser/);
  assert.match(shell, /active\.id !== "home" && active\.id !== "office"/);
  assert.match(shell, /navigateToRoute\(preferredHome\)/);
});

test("Chooser and Settings expose only implemented 0.3.0 display choices", () => {
  assert.match(chooser, /Pixel Office/);
  assert.match(chooser, /Agent Home/);
  assert.match(settings, /data-display-settings/);
  assert.match(settings, /클래식 애널리스트/);
  assert.match(settings, /경제 탐구생/);
  assert.match(settings, /Home 선택과 화면 설정 초기화/);
  assert.doesNotMatch(`${chooser}\n${settings}`, /모던 퀀트|코지 프로페서/);
});

