import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

const STYLES = new URL("../../public/styles.css", import.meta.url);

test("the touch hit area does not fight the tooltip for ::after", async () => {
  const css = await readFile(STYLES, "utf8");
  // 툴팁은 ::after에 글자를 넣는다. 같은 버튼의 히트 영역도 ::after를 쓰면 나중에
  // 오는 규칙이 content와 width를 덮어써서 "삭제"가 두 줄로 쪼개지고 상자가 늘어난다.
  const block = css.slice(css.indexOf("눌리는 영역만 44px로 넓힌다"));
  const rule = block.slice(0, block.indexOf("}"));

  assert.match(rule, /::before/, "히트 영역은 ::before를 써야 한다");
  assert.doesNotMatch(rule, /-delete::after|icon-btn::after|-send::after/);
});

test("the tooltip still owns ::after", async () => {
  const css = await readFile(STYLES, "utf8");
  assert.match(css, /\[data-tooltip\][^{]*::after\s*\{[^}]*content: attr\(data-tooltip\)/);
});
