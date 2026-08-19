import { useCallback, useEffect, useRef, useState } from "react";
import { getJson } from "../../api";

export type CompanyCandidate = {
  /** 이름 일부만 겹친 약한 후보가 아니라는 뜻. 주제어에 후보 목록을 띄우지 않는 데 쓴다. */
  strong?: boolean;
  ticker: string;
  name: string;
  market: string;
  cik?: string;
  sector?: string;
  source?: string;
  score?: number;
};

export type CompanyResolution = {
  query: string;
  status: "confident" | "ambiguous" | "unknown";
  match: CompanyCandidate | null;
  candidates: CompanyCandidate[];
  reason?: string;
};

const DEBOUNCE_MS = 250;

/** 입력이 어느 기업인지 서버에 묻는다. 규칙 기반이라 LLM 토큰을 쓰지 않는다.
 *
 *  `preferHome`은 원주와 미국 ADR이 갈릴 때 자국 상장을 대표로 세운다.
 *  워치리스트가 쓴다 — 도요타를 담았는데 통화도 시간대도 다른 TM이 들어오면
 *  안 된다. 기업분석은 반대로 SEC 등록분이라야 공시와 재무가 붙는다.
 */
export function useCompanyResolution(query: string, options?: { preferHome?: boolean }) {
  const preferHome = options?.preferHome === true;
  const [resolution, setResolution] = useState<CompanyResolution | null>(null);
  const [pending, setPending] = useState(false);
  // 사용자가 후보를 고르면 그 선택이 이후 타이핑 전까지 이긴다.
  const [picked, setPicked] = useState<CompanyCandidate | null>(null);
  const requestId = useRef(0);
  // 선택이 입력칸을 그 회사 이름으로 바꾸는 호출자가 있다(워치리스트). 그 변경까지
  // "사용자가 다시 타이핑했다"로 읽으면 방금 고른 후보가 즉시 지워져, 재조회가
  // 끝날 때까지 후보 목록이 다시 뜨고 Enter가 이름 안의 쉼표를 구분자로 쪼갠다.
  const pickedQueryRef = useRef<string | null>(null);

  useEffect(() => {
    const text = query.trim();
    if (text.length < 1) {
      setResolution(null);
      setPending(false);
      return;
    }
    const id = requestId.current + 1;
    requestId.current = id;
    setPending(true);
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const payload = await getJson<CompanyResolution>(
            `/api/company/resolve?q=${encodeURIComponent(text)}&limit=6${preferHome ? "&prefer=home" : ""}`,
          );
          // 늦게 도착한 옛 응답이 최신 입력을 덮어쓰지 않게 한다.
          if (requestId.current !== id) return;
          setResolution(payload);
        } catch {
          if (requestId.current !== id) return;
          // 판단을 못 해도 입력을 막지 않는다. 확인 UI만 사라진다.
          setResolution(null);
        } finally {
          if (requestId.current === id) setPending(false);
        }
      })();
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query, preferHome]);

  /** 후보를 고른다. `nextQuery`는 그 선택 때문에 입력칸이 바뀔 값이다. */
  const pick = useCallback((candidate: CompanyCandidate | null, nextQuery?: string) => {
    pickedQueryRef.current = candidate && nextQuery !== undefined ? nextQuery : null;
    setPicked(candidate);
  }, []);

  useEffect(() => {
    // 선택이 만든 입력 변경은 그 선택을 지우지 않는다.
    if (pickedQueryRef.current !== null && pickedQueryRef.current === query) return;
    pickedQueryRef.current = null;
    setPicked(null);
  }, [query]);

  const effective = picked || (resolution?.status === "confident" ? resolution.match : null);
  return { resolution, pending, picked, setPicked, pick, effective };
}
