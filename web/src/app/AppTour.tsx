import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { toHash, type RouteId } from "./routes";

/** 둘러보기 — 실제 화면을 옮겨 다니며 자료의 흐름을 보여준다.
 *
 *  안내 카드 안의 그림 3장으로도 흐름은 설명되지만, 처음 여는 사람이 정작 모르는 것은
 *  **그 일이 어느 화면에서 벌어지느냐**다. 그래서 실제 탭으로 이동해 그 자리를 조명한다.
 *
 *  들르는 곳은 셋이다: RSS 피드(자료가 들어온다) → 시장 내러티브(이야기가 된다) →
 *  브리핑(결과물이 된다). 화면 사용법이 아니라 자료가 지나가는 경로를 말한다.
 *
 *  **조명은 구멍이 아니라 큰 그림자다.** 오려내기(clip-path)는 브라우저마다 다르게
 *  깨지므로, 대상 크기의 빈 상자에 화면을 덮을 만큼 큰 `box-shadow`를 줘서 그 상자만
 *  밝게 남긴다. 상자는 `pointer-events: none`이라 클릭을 막지 않는다.
 *
 *  대상을 못 찾으면 조명 없이 설명만 가운데 띄운다. 좁은 화면에서는 좌측 내비가 접혀
 *  버튼이 없을 수 있는데, 그렇다고 둘러보기가 멈추면 안 된다.
 */

type Stop = {
  readonly route: RouteId;
  readonly title: string;
  readonly body: string;
};

export const TOUR_STOPS: ReadonlyArray<Stop> = [
  {
    route: "rss",
    title: "여기로 자료가 들어옵니다",
    body: "고른 시장의 매체에서 뉴스를 자동으로 모읍니다. 직접 저장한 기사·리포트·공시도 같은 곳에 쌓이고, 전부 검색할 수 있게 정리됩니다.",
  },
  {
    route: "market-memory",
    title: "모인 자료가 이야기가 됩니다",
    body: "낱개 기사 대신 지금 시장을 움직이는 흐름으로 묶습니다. 여러 매체가 함께 다룬 것만 흐름이 되고, 그 흐름은 하루로 끝나지 않고 강해지거나 약해지는 상태로 이어집니다.",
  },
  {
    route: "briefing",
    title: "이야기가 결과물이 됩니다",
    body: "모인 자료와 흐름으로 매일의 브리핑을 만듭니다. 어떤 자료를 근거로 삼았는지가 함께 남고, 기업 분석과 테마 분석도 같은 자료를 씁니다.",
  },
];

const CALLOUT_WIDTH = 340;
const GAP = 14;
const EDGE = 12;

type Rect = { top: number; left: number; width: number; height: number };

function navTarget(route: RouteId): HTMLElement | null {
  return document.querySelector<HTMLElement>(`.react-left-nav-item[data-route="${route}"]`);
}

function readRect(element: HTMLElement | null): Rect | null {
  if (!element) return null;
  const box = element.getBoundingClientRect();
  if (box.width < 1 || box.height < 1) return null;
  return { top: box.top, left: box.left, width: box.width, height: box.height };
}

/** 설명 상자를 대상 옆에 놓되 화면 밖으로 나가지 않게 붙든다. */
function calloutPosition(rect: Rect | null) {
  if (!rect) {
    return { top: Math.max(EDGE, window.innerHeight / 2 - 120), left: Math.max(EDGE, (window.innerWidth - CALLOUT_WIDTH) / 2) };
  }
  const rightRoom = window.innerWidth - (rect.left + rect.width) - GAP;
  const left = rightRoom >= CALLOUT_WIDTH + EDGE
    ? rect.left + rect.width + GAP
    : Math.min(Math.max(EDGE, rect.left), window.innerWidth - CALLOUT_WIDTH - EDGE);
  const top = Math.min(
    Math.max(EDGE, rect.top - 8),
    Math.max(EDGE, window.innerHeight - 260),
  );
  return { top, left };
}

export function AppTour({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  const stop = TOUR_STOPS[Math.min(index, TOUR_STOPS.length - 1)];

  // 그 화면으로 옮긴다. 설명만 바뀌고 뒤가 그대로면 어디를 말하는지 알 수 없다.
  useEffect(() => {
    const next = toHash(stop.route);
    if (window.location.hash !== next) window.location.hash = next;
  }, [stop.route]);

  // 대상은 라우트 전환 뒤에야 자리를 잡는다. 한 번 재고 끝내지 않고 잠깐 따라간다.
  useEffect(() => {
    let alive = true;
    const measure = () => { if (alive) setRect(readRect(navTarget(stop.route))); };
    measure();
    const timers = [60, 180, 400].map((ms) => window.setTimeout(measure, ms));
    const onView = () => measure();
    window.addEventListener("resize", onView);
    window.addEventListener("scroll", onView, true);
    return () => {
      alive = false;
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener("resize", onView);
      window.removeEventListener("scroll", onView, true);
    };
  }, [stop.route, index]);

  useEffect(() => { headingRef.current?.focus(); }, [index]);

  const finish = useCallback(() => { onDone(); }, [onDone]);

  // 설명 상자 밖은 조명일 뿐이라 포커스가 나가면 어디 있는지 알 수 없다.
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") { event.preventDefault(); finish(); return; }
    if (event.key !== "Tab") return;
    const items = Array.from(cardRef.current?.querySelectorAll<HTMLElement>("button:not([disabled])") ?? []);
    if (!items.length) return;
    const [first, last] = [items[0], items[items.length - 1]];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !cardRef.current?.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const place = calloutPosition(rect);
  const last = index === TOUR_STOPS.length - 1;

  return (
    <div className="tour-layer" role="dialog" aria-modal="true" aria-labelledby="tourTitle" onKeyDown={onKeyDown}>
      {/* **두 상태에 각자 key를 준다.** 같은 `div`라 key가 없으면 React가 노드를 재사용해
          클래스만 바꾸는데, 그 순간 트랜지션이 대상 없는 자리(-20px/0)에서 시작해 그대로
          갇혔다 — 조명이 화면 밖 0×0으로 남았다(실측). key를 나누면 조명은 처음부터
          제자리에 생기고, 다음 장으로 옮길 때만 움직인다. */}
      {rect ? (
        <div
          key="spot"
          className="tour-spot"
          aria-hidden="true"
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
        />
      ) : (
        <div key="scrim" className="tour-scrim" aria-hidden="true" />
      )}

      <div className="tour-card" ref={cardRef} style={{ top: place.top, left: place.left, width: CALLOUT_WIDTH }}>
        <p className="tour-count">{index + 1} / {TOUR_STOPS.length}</p>
        <h2 id="tourTitle" tabIndex={-1} ref={headingRef}>{stop.title}</h2>
        <p className="tour-body">{stop.body}</p>
        <div className="tour-acts">
          <button className="tour-skip" type="button" onClick={finish}>끝내기</button>
          {index > 0 && (
            <button className="tour-btn" type="button" onClick={() => setIndex(index - 1)}>이전</button>
          )}
          <button
            className="tour-btn tour-btn--go"
            type="button"
            onClick={() => (last ? finish() : setIndex(index + 1))}
          >
            {last ? "둘러보기 마치기" : "다음"}
          </button>
        </div>
      </div>
    </div>
  );
}
