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

/** 배지에 붙일 엔진 이름. 모델명이 있으면 tooltip으로 함께 보여준다. */
export function engineTooltip(engine?: string, detail?: string): string | undefined {
  const name = String(engine || "").trim();
  const model = String(detail || "").trim();
  if (!name) return undefined;
  return model ? `${name} · ${model}` : name;
}
