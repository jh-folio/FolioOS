/** 저장 목록 세 곳(브리핑·기업 분석·딥 리서치)이 같은 서식을 쓰게 한다.
 *
 * 예전에는 같은 개념의 날짜를 화면마다 다르게 적었다 — `2026.08.04`,
 * `2026. 6. 15.`, `2026-06-13`. 브리핑 카드는 초 단위 시각까지 노출해 혼자 길었다.
 */

/** 목록의 날짜. 어느 화면이든 `2026.08.04`. */
export function listDate(value?: string): string {
  const text = String(value || "").trim();
  if (!text) return "";
  const iso = text.slice(0, 10);
  const matched = /^(\d{4})[-.](\d{2})[-.](\d{2})$/.exec(iso);
  if (matched) return `${matched[1]}.${matched[2]}.${matched[3]}`;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text;
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${parsed.getFullYear()}.${pad(parsed.getMonth() + 1)}.${pad(parsed.getDate())}`;
}

/** 그룹 머리 오른쪽. `3건 · 최근 2026.06.15`. */
export function groupMeta(count: number, latest?: string): string {
  const date = listDate(latest);
  return date ? `${count}건 · 최근 ${date}` : `${count}건`;
}

/** 배지 옆에 덧붙일 맥락(제공자·도구). 없으면 빈 문자열.
 *
 * tooltip으로 띄우지 않는다. 카드가 `overflow: hidden`이라 카드 밖으로 나가는
 * 툴팁은 잘리고, 덧붙일 것이 없을 때는 배지 글자를 그대로 되풀이해 소음이 된다.
 */
export function engineNote(engine?: string, detail?: string): string {
  const name = String(engine || "").trim();
  const note = String(detail || "").trim();
  if (!name || !note || note === name) return "";
  return note;
}
