import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const preferences = fs.readFileSync(new URL("../src/app/homePreference.ts", import.meta.url), "utf8");
const routes = fs.readFileSync(new URL("../src/app/routes.ts", import.meta.url), "utf8");
const shell = fs.readFileSync(new URL("../src/app/AppShell.tsx", import.meta.url), "utf8");
const home = fs.readFileSync(new URL("../src/app/AgentHome.tsx", import.meta.url), "utf8");
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

test("Pixel Office is held: the runtime survives but nothing reaches it", () => {
  // 코드와 에셋은 보존한다. 재개할 때 처음부터 다시 만들지 않기 위해서다.
  assert.match(routes, /\| "office"/);
  assert.match(shell, /<PixelOfficeRoute \/>/);

  // 진입점은 전부 막는다: 내비게이션, 기본 진입, 첫 실행 선택, 홈 전환 버튼,
  // 그리고 오래된 북마크로 들어오는 #/office까지.
  assert.match(routes, /id: "office"[^\n]*visibleInNav: false/);
  assert.match(routes, /const DEFAULT_ROUTE: RouteId = "home"/);
  assert.match(shell, /const showHomeChooser = false/);
  assert.match(shell, /replaceState[\s\S]{0,300}#\/home/);
  assert.doesNotMatch(home, /HomeModeSwitch/);
  assert.match(preferences, /return "home";/);
});

test("Settings exposes only display choices that are actually live", () => {
  assert.match(settings, /data-display-settings/);
  assert.match(settings, /테마/);
  // 움직임 줄이기는 접근성 설정이라 Pixel Office 보류와 무관하게 남는다.
  assert.match(settings, /움직임 줄이기/);
  // Pixel Office 전용 선택지는 보류 동안 노출하지 않는다.
  assert.doesNotMatch(settings, /기본 Home/);
  assert.doesNotMatch(settings, /클래식 애널리스트|경제 탐구생/);
});
