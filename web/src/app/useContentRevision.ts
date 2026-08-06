import { useEffect, useRef, useState } from "react";
import { getJson } from "../api";

/** 화면이 구독하는 저장소 이름. 서버의 `CONTENT_KINDS`와 같은 말을 쓴다. */
export type ContentKind =
  | "briefing"
  | "companyAnalysis"
  | "topicReport"
  | "marketMemory"
  | "rss"
  | "note"
  | "portfolio"
  | "watchlist";

type RevisionPayload = { revisions?: Partial<Record<ContentKind, number>> };

const POLL_MS = 5_000;

/** 내용이 바뀌면 올라가는 수. 목록을 다시 읽는 신호로 쓴다.
 *
 * 자기가 실행한 작업만 보면 자동화가 만든 브리핑이나 다른 탭이 수집한 RSS가
 * 화면에 없다. 서버가 저장소별 변경 시각을 알려주므로 출처를 가리지 않는다.
 *
 * 탭이 보이지 않을 때는 묻지 않는다 — 배경 탭이 5초마다 서버를 두드릴 이유가 없다.
 */
export function useContentRevision(kind: ContentKind): number {
  const [tick, setTick] = useState(0);
  const seen = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;
    let timer = 0;

    async function check() {
      if (!alive || document.hidden) return;
      try {
        const payload = await getJson<RevisionPayload>("/api/content-revisions");
        const current = Number(payload.revisions?.[kind] ?? 0);
        if (!alive) return;
        // 첫 응답은 기준점이다. 화면을 여는 순간 새로고침을 부르면 안 된다.
        if (seen.current === null) seen.current = current;
        else if (current !== seen.current) {
          // 값이 달라졌으면 다시 읽는다. 커졌을 때만 보면 삭제를 놓친다 —
          // 가장 최근 파일이 사라지면 최신 시각은 오히려 내려간다.
          seen.current = current;
          setTick((value) => value + 1);
        }
      } catch {
        // 신호를 못 받아도 화면은 그대로 둔다. 다음 시도에서 따라잡는다.
      }
    }

    function schedule() {
      timer = window.setTimeout(async () => {
        await check();
        if (alive) schedule();
      }, POLL_MS);
    }

    // 탭으로 돌아왔을 때는 기다리지 않고 바로 확인한다.
    function onVisible() {
      if (!document.hidden) void check();
    }

    void check();
    schedule();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [kind]);

  return tick;
}
