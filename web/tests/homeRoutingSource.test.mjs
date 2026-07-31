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

test("Pixel Office is held: the shipped app carries no trace of it", () => {
  // 소스는 저장소에 남아 있지만(재개용) 실행되는 앱에는 배선이 없다.
  // 라우트 id, 아이콘, 렌더 분기, 첫 실행 선택 화면까지 전부 끊는다.
  assert.doesNotMatch(routes, /"office"/);
  assert.doesNotMatch(shell, /PixelOfficeRoute/);
  assert.doesNotMatch(shell, /HomeModeChooser/);
  assert.doesNotMatch(home, /HomeModeSwitch/);

  assert.match(routes, /const DEFAULT_ROUTE: RouteId = "home"/);
  assert.match(preferences, /return "home";/);
  // 오래된 북마크는 조용히 홈으로 보낸다.
  assert.match(shell, /office\(\?:/);
  assert.match(shell, /replaceState[\s\S]{0,300}#\/home/);
});

test("the release package excludes the held feature", async () => {
  const packager = await import("node:fs/promises")
    .then((fs) => fs.readFile(new URL("../../scripts/package_release.py", import.meta.url), "utf8"));
  // 도달할 수 없는 기능의 백엔드와 스프라이트를 배포본에 넣을 이유가 없다.
  assert.match(packager, /"pixel_office"/);
  assert.match(packager, /"pixel-office"/);
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
