import { useEffect, useRef, useState } from "react";
import { getJson } from "../../api";

export type CompanyCandidate = {
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

/** 입력이 어느 기업인지 서버에 묻는다. 규칙 기반이라 LLM 토큰을 쓰지 않는다. */
export function useCompanyResolution(query: string) {
  const [resolution, setResolution] = useState<CompanyResolution | null>(null);
  const [pending, setPending] = useState(false);
  // 사용자가 후보를 고르면 그 선택이 이후 타이핑 전까지 이긴다.
  const [picked, setPicked] = useState<CompanyCandidate | null>(null);
  const requestId = useRef(0);

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
            `/api/company/resolve?q=${encodeURIComponent(text)}&limit=6`,
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
  }, [query]);

  useEffect(() => setPicked(null), [query]);

  const effective = picked || (resolution?.status === "confident" ? resolution.match : null);
  return { resolution, pending, picked, setPicked, effective };
}
