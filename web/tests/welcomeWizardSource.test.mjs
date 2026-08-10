import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

const wizard = () => readFile(new URL("../src/app/WelcomeWizard.tsx", import.meta.url), "utf8");
const css = () => readFile(new URL("../../public/styles.css", import.meta.url), "utf8");

test("첫 실행 안내는 다섯 단계이고 테마가 자기 단계를 갖는다", async () => {
  const source = await wizard();

  // 예전 4단계에서는 환영 카드가 "이 앱은 무엇인가"와 "무슨 색으로 볼 것인가"를 함께 물었다.
  assert.match(source, /const STEPS: ReadonlyArray<StepId> = \["welcome", "theme", "engine", "markets", "done"\]/);
  assert.match(source, /step === "theme" &&/);
  assert.match(source, /어떤 화면으로 보시겠어요\?/);
  // 환영 단계에서는 테마를 더 이상 묻지 않는다.
  const welcomeBlock = source.slice(source.indexOf('{step === "welcome" &&'), source.indexOf('{step === "theme" &&'));
  assert.doesNotMatch(welcomeBlock, /THEME_CHOICES/);
});

test("AI 단계는 부담이 적은 것부터 세 가지를 같은 말로 낸다", async () => {
  const source = await wizard();
  const block = source.slice(source.indexOf('aria-label="생성 방식"'));
  const labels = [...block.slice(0, 700).matchAll(/>([^<>{]+)<\/button>/g)].map((m) => m[1].trim());

  assert.deepEqual(labels.slice(0, 3), ["AI 없이", "CLI", "API"]);
  // 짧은 라벨은 설명을 대신하지 못한다. 셋 다 고르면 무엇인지 한 문단이 따라온다.
  assert.match(source, /engine === "none" && \(/);
  assert.match(source, /내 컴퓨터에 설치해서 쓰는/);
  assert.match(source, /제공사 서버를 부르는 열쇠/);
});

test("CLI를 고르면 안내 안에서 설치와 로그인을 끝낼 수 있다", async () => {
  const source = await wizard();
  const settings = await readFile(new URL("../src/app/SettingsRoute.tsx", import.meta.url), "utf8");
  const setup = await readFile(new URL("../src/app/AgentCliSetup.tsx", import.meta.url), "utf8");

  // 예전 안내는 "설정 탭에서 설치와 로그인을 마칠 수 있습니다"라고 적어 뒀는데 설정 탭에도
  // 그 버튼이 없었다 — install/login API를 부르는 화면이 저장소에 하나도 없었다.
  assert.match(source, /<AgentCliSetup/);
  assert.match(settings, /<AgentCliSetup/);
  assert.match(setup, /\/api\/agent-bridge\/install\//);
  assert.match(setup, /\/api\/agent-bridge\/login\//);
  assert.match(setup, /\/api\/agent-bridge\/settings\?refresh=true/);

  // 경계 셋을 화면이 먼저 말한다.
  assert.match(setup, /Windows에서만/);
  assert.match(setup, /별도 콘솔 창/);

  // 상태 문구는 한 곳이 소유한다. 설정 탭에 사본을 두면 같은 상태를 두 화면이 다르게 말한다.
  assert.doesNotMatch(settings, /function adapterStatus\(/);
  assert.doesNotMatch(settings, /function adapterStatusClass\(/);
  assert.doesNotMatch(settings, /function checkedAtLabel\(/);
  assert.match(settings, /import \{ checkedAtLabel \} from "\.\/aiConnectionStatus"/);
});

test("API 제공사 행은 언제 확인한 값인지 밝히고 잔액을 아는 척하지 않는다", async () => {
  const settings = await readFile(new URL("../src/app/SettingsRoute.tsx", import.meta.url), "utf8");

  // `사용 가능`이 방금인지 지난주인지 모르면 상태를 믿을 수 없다. 서버는 `checkedAt`을
  // 주고 있었는데 화면이 버리고 있었다.
  assert.match(settings, /className="cli-provider-checked"/);
  // 계정 잔액·사용량은 관리자 키를 요구해 일반 API 키로는 볼 수 없다. 모르는 것을
  // 아는 척하지 않고 어디서 보는지만 말한다.
  assert.match(settings, /사용량과 잔액은 제공사 콘솔/);
});

test("튜토리얼은 선택이지 절차가 아니다", async () => {
  const source = await wizard();
  const tour = await readFile(new URL("../src/app/WelcomeTour.tsx", import.meta.url), "utf8");

  // 진행 막대의 단계로 세면 건너뛸 수 없는 것처럼 읽힌다.
  assert.doesNotMatch(source, /"tour"/);
  assert.match(source, /STEPS: ReadonlyArray<StepId> = \["welcome", "theme", "engine", "markets", "done"\]/);
  assert.match(source, /tour < 0 && <p className="welcome-eyebrow"/);
  assert.match(source, /welcome-tour-open/);
  // 자료 → 이야기 → 결과물. 화면 사용법이 아니라 흐름을 말한다.
  assert.match(tour, /자료가 들어옵니다/);
  assert.match(tour, /자료가 이야기가 됩니다/);
  assert.match(tour, /이야기가 결과물이 됩니다/);
  // 큰 SVG는 375px에서 글자가 뭉개진다. 박스로 쌓아 세로로 접히게 한다.
  assert.doesNotMatch(tour, /<svg/);
});

test("안내 색은 앱 계약을 따른다 — 블루는 의미색이라 UI 액센트가 아니다", async () => {
  const sheet = await css();
  const block = sheet.slice(sheet.indexOf("/* ── 첫 실행 안내"), sheet.indexOf(".welcome-shell :focus-visible"));

  // 실측으로 안내의 CTA는 rgb(122,182,234)인데 앱의 .btn--primary는 rgb(11,12,15)라
  // 첫 화면만 톤이 달랐다(DESIGN_SYSTEM §1 원칙 4 — 색은 의미를 가질 때만).
  assert.doesNotMatch(block, /--folio-blue/);
  assert.match(block, /\.welcome-btn--go \{[^}]*background: var\(--folio-surface-dark\)/);
  assert.match(
    block,
    /\.welcome-markets button\[aria-pressed="true"\] \{[^}]*background: var\(--folio-surface-dark\)/,
  );
  // 포커스 링만 계속 블루다 — 그건 앱 전역 계약(--folio-focus)이다.
  assert.match(sheet, /\.welcome-shell :focus-visible \{ outline: 2px solid var\(--folio-focus\)/);
});
