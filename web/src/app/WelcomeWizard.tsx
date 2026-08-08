import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { getJson, postJson, putJson } from "../api";
import { FolioWordmark } from "./FolioWordmark";
import { useThemePreference, type ThemePreference } from "./themePreference";

/** 첫 실행 안내.
 *
 *  Folio OS는 자료를 모으고 읽는 도구라 첫 화면이 비어 있다. 무엇을 먼저 해야 하는지
 *  모르면 빈 화면만 보고 닫는다. 그래서 **켠 뒤 바로 쓸 수 있게 되는 것 두 가지**만
 *  묻는다 — 어느 시장을 볼지, AI를 쓸지. 둘 다 나중에 설정에서 바꿀 수 있고, 전부
 *  건너뛰어도 앱은 규칙 기반으로 동작한다.
 *
 *  판정은 서버가 한다(`/api/onboarding`). 안내 파일 유무만 보면 쓰던 사람이 새 버전으로
 *  올릴 때 처음 쓰는 사람 취급을 받는다 — 그 파일은 배포 zip에 없다.
 *
 *  디자인은 이 화면에만 쓰는 언어다(2026-08-08 사용자 결정). 색면이 뒤에서 흐르고
 *  카드는 불투명하다 — 유리를 카드에 쓰면 안쪽 면과 깊이 체계가 겹쳐 둘 다 죽는다.
 *  상세는 `features/frontend_ui/README.md`의 "첫 실행 안내 화면"을 본다.
 */

type MarketScopeState = {
  readonly selected: ReadonlyArray<string>;
  readonly markets: ReadonlyArray<{ readonly id: string; readonly label: string }>;
};

type WorkspaceLocation = { readonly path: string; readonly outsideAppFolder: boolean };

type StepId = "welcome" | "engine" | "markets" | "done";

const STEPS: ReadonlyArray<StepId> = ["welcome", "engine", "markets", "done"];

const THEME_CHOICES: ReadonlyArray<{ id: ThemePreference; label: string }> = [
  { id: "light", label: "라이트" },
  { id: "dark", label: "다크" },
  { id: "system", label: "시스템" },
];

const PROVIDERS = [
  { id: "openai", label: "OpenAI", url: "https://platform.openai.com/api-keys" },
  { id: "gemini", label: "Gemini", url: "https://aistudio.google.com/apikey" },
  { id: "claude", label: "Claude", url: "https://console.anthropic.com/settings/keys" },
] as const;

type ProviderId = (typeof PROVIDERS)[number]["id"];

/** 서버는 한국어 이름을 주지만 화면은 다른 곳과 같은 코드를 쓴다(`EUROPE` → `EU`). */
const MARKET_CODES: Record<string, string> = { US: "US", KR: "KR", EUROPE: "EU", JP: "JP" };

const ICONS: Record<StepId, ReactNode> = {
  welcome: <path d="M3 7.5 12 3l9 4.5-9 4.5zM3 12l9 4.5 9-4.5M3 16.5 12 21l9-4.5" />,
  engine: (
    <>
      <path d="M12 3.5v3M12 17.5v3M5.4 5.4l2.1 2.1M16.5 16.5l2.1 2.1M3.5 12h3M17.5 12h3M5.4 18.6l2.1-2.1M16.5 7.5l2.1-2.1" />
      <circle cx="12" cy="12" r="3.2" />
    </>
  ),
  markets: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M3.4 12h17.2M12 3.4c2.5 2.6 3.8 5.5 3.8 8.6S14.5 18 12 20.6C9.5 18 8.2 15.1 8.2 12S9.5 6 12 3.4z" />
    </>
  ),
  done: <path d="M5 12.6 9.6 17 19 7.6" />,
};

const EYEBROWS: Record<StepId, string> = {
  welcome: "환영합니다",
  engine: "선택 사항",
  markets: "수집 범위",
  done: "준비 완료",
};

function StepIcon({ step }: { step: StepId }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">{ICONS[step]}</svg>
  );
}

export function WelcomeWizard({ onFinish }: { onFinish: () => void }) {
  const theme = useThemePreference();
  const [step, setStep] = useState<StepId>("welcome");
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");

  // 단계를 넘기면 안내 문구를 지운다. 남겨두면 이전 단계의 "저장했습니다"가 다음
  // 단계 아래에 그대로 붙어, 아직 저장하지 않은 것을 저장했다고 읽힌다.
  const goto = useCallback((next: StepId) => { setNote(""); setStep(next); }, []);

  const [engine, setEngine] = useState<"none" | "api" | "cli">("none");
  const [provider, setProvider] = useState<ProviderId>("openai");
  const [apiKey, setApiKey] = useState("");

  const [scope, setScope] = useState<MarketScopeState | null>(null);
  const [markets, setMarkets] = useState<string[]>([]);
  const [collecting, setCollecting] = useState(false);

  const [location, setLocation] = useState<WorkspaceLocation | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const payload = await getJson<MarketScopeState>("/api/market-scope");
        if (cancelled) return;
        setScope(payload);
        setMarkets([...payload.selected]);
      } catch {
        /* 안내를 못 띄울 이유는 아니다. 이 단계는 건너뛸 수 있다. */
      }
      try {
        const where = await getJson<WorkspaceLocation>("/api/workspace");
        if (!cancelled) setLocation(where);
      } catch {
        /* 위와 같다. */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const finish = useCallback(async (skipped: boolean) => {
    setBusy("finish");
    try {
      await postJson("/api/onboarding/complete", { skipped });
    } catch {
      /* 기록에 실패해도 앱은 써야 한다. 다음 실행에 안내가 한 번 더 뜰 뿐이다. */
    } finally {
      setBusy("");
      onFinish();
    }
  }, [onFinish]);

  const saveEngine = async () => {
    setBusy("engine");
    setNote("");
    try {
      await postJson("/api/settings", {
        agent: { enabled: engine !== "none", mode: engine === "cli" ? "cli" : "api" },
        ...(engine === "api" && apiKey.trim()
          ? { llm: { provider, providers: { [provider]: { apiKey: apiKey.trim() } } } }
          : {}),
      });
      setApiKey("");
      // 성공 문구는 두지 않는다. 다음 단계로 넘어가는 것이 이미 확인이고, 문구를
      // 남기면 다음 단계 아래에 붙어 그 단계를 저장했다고 읽힌다.
      goto("markets");
    } catch (err) {
      setNote(err instanceof Error ? err.message : "저장하지 못했습니다.");
    } finally {
      setBusy("");
    }
  };

  const saveMarkets = async () => {
    if (!scope || !markets.length) { goto("done"); return; }
    setBusy("markets");
    setNote("");
    try {
      const payload = await putJson<{ newlyEnabled?: string[] }>("/api/market-scope", { selected: markets });
      setCollecting(!!payload.newlyEnabled?.length);
      goto("done");
    } catch (err) {
      setNote(err instanceof Error ? err.message : "저장하지 못했습니다.");
    } finally {
      setBusy("");
    }
  };

  const toggleMarket = (id: string) => {
    setMarkets((current) => {
      const next = current.includes(id) ? current.filter((v) => v !== id) : [...current, id];
      // 전부 끄면 남는 화면이 없다. 마지막 하나는 끄지 않는다.
      return next.length ? next : current;
    });
  };

  // `aria-modal="true"`는 뒤 화면이 없는 셈 친다고 선언하는 것이다. Tab이 뒤로
  // 빠져나가면 스크린리더가 읽지 않는 곳에 포커스가 놓여 어디 있는지 알 수 없게 된다.
  const shellRef = useRef<HTMLDivElement | null>(null);

  const focusables = () => Array.from(
    shellRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    ) ?? [],
  );

  useEffect(() => {
    // 단계가 바뀌면 새 내용의 처음으로 포커스를 옮긴다. 그러지 않으면 이전 단계에서
    // 누른 버튼이 사라진 자리에 포커스가 남아 body로 떨어진다.
    shellRef.current?.querySelector<HTMLElement>("h1")?.focus();
  }, [step]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      void finish(true);
      return;
    }
    if (event.key !== "Tab") return;
    const items = focusables();
    if (!items.length) return;
    const [first, last] = [items[0], items[items.length - 1]];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !shellRef.current?.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const index = STEPS.indexOf(step);
  const providerMeta = PROVIDERS.find((item) => item.id === provider);

  return (
    <div
      className="welcome-shell"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcomeTitle"
      ref={shellRef}
      onKeyDown={onKeyDown}
    >
      {/* 배경은 뒤에 떠 있는 앱을 블러 처리한 것이다(CSS `backdrop-filter`). 별도
          레이어를 두지 않는다 — 앱이 비쳐야 "건너뛰면 바로 이거"가 눈에 보인다. */}
      <div className="welcome-card">
        <header className="welcome-head">
          <FolioWordmark />
          <p className="welcome-count">단계 <b>{index + 1}</b> / {STEPS.length}</p>
        </header>

        <div
          className="welcome-rule"
          role="progressbar"
          aria-label="진행 단계"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={index + 1}
          style={{ ["--welcome-fill" as string]: `${((index + 1) / STEPS.length) * 100}%` }}
        />

        <section className="welcome-body">
          <p className="welcome-eyebrow"><StepIcon step={step} />{EYEBROWS[step]}</p>

          {step === "welcome" && (
            <>
              <h1 id="welcomeTitle" tabIndex={-1}>내 PC 안의 투자 리서치 작업실</h1>
              <p>
                뉴스·공시·리포트를 이 컴퓨터에 모아 읽고, 매일 브리핑과 기업 분석을 만듭니다.{" "}
                <strong>자료와 보고서는 전부 이 컴퓨터에만 저장됩니다.</strong>
              </p>
              <p className="welcome-muted">
                두 가지만 정하면 바로 쓸 수 있습니다. 둘 다 나중에 설정에서 바꿀 수 있습니다.
              </p>
              <div className="welcome-choices" role="group" aria-label="화면 테마">
                {THEME_CHOICES.map((choice) => (
                  <button
                    type="button"
                    key={choice.id}
                    aria-pressed={theme.preference === choice.id}
                    onClick={() => theme.setPreference(choice.id)}
                  >
                    {choice.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === "engine" && (
            <>
              <h1 id="welcomeTitle" tabIndex={-1}>AI를 쓰시겠어요?</h1>
              <p>
                브리핑·기업 분석·테마 분석의 문장을 AI가 씁니다.{" "}
                <strong>AI가 없어도 앱은 그대로 동작합니다</strong> — 자료 수집·검색·차트는 모두
                규칙으로 만들고, 보고서도 규칙 기반으로 나옵니다.
              </p>
              <div className="welcome-choices" role="group" aria-label="생성 방식">
                <button type="button" aria-pressed={engine === "none"} onClick={() => setEngine("none")}>AI 없이</button>
                <button type="button" aria-pressed={engine === "api"} onClick={() => setEngine("api")}>API 키</button>
                <button type="button" aria-pressed={engine === "cli"} onClick={() => setEngine("cli")}>Agent CLI</button>
              </div>

              {engine === "api" && (
                <>
                  <div className="welcome-choices" role="group" aria-label="제공사">
                    {PROVIDERS.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        aria-pressed={provider === item.id}
                        onClick={() => setProvider(item.id)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <label className="welcome-field">
                    <span>API 키</span>
                    <input
                      type="password"
                      value={apiKey}
                      autoComplete="off"
                      placeholder="나중에 설정에서 넣어도 됩니다"
                      onChange={(event) => setApiKey(event.target.value)}
                    />
                  </label>
                  <p className="welcome-muted">
                    키는 이 PC의 <code>.env</code> 파일에만 저장됩니다. 발급:{" "}
                    <a href={providerMeta?.url} target="_blank" rel="noreferrer">{providerMeta?.label} 키 페이지</a>
                  </p>
                </>
              )}

              {engine === "cli" && (
                <p className="welcome-muted">
                  이미 쓰고 있는 Codex·Claude·Antigravity CLI를 그대로 씁니다. 설정 탭의 AI Agent에서
                  설치와 로그인을 마칠 수 있습니다. CLI는 한 번 실행에 수십 초가 걸립니다.
                </p>
              )}
            </>
          )}

          {step === "markets" && (
            <>
              <h1 id="welcomeTitle" tabIndex={-1}>어느 시장을 보시겠어요?</h1>
              <p>
                여기서 끈 시장은 자료 수집이 멈추고 화면 전체에서 숨습니다. 유가·달러 같은 글로벌
                자료는 항상 보입니다.
              </p>
              <p className="welcome-muted">
                US 뉴욕·나스닥 · KR 코스피·코스닥 · EU 런던·프랑크푸르트 · JP 도쿄
              </p>
              {scope ? (
                <div className="welcome-markets" role="group" aria-label="수집·표시할 시장">
                  {scope.markets.map((market) => {
                    const code = MARKET_CODES[market.id] ?? market.id;
                    return (
                      <button
                        type="button"
                        key={market.id}
                        data-code={code}
                        aria-label={`${code} ${market.label}`}
                        aria-pressed={markets.includes(market.id)}
                        onClick={() => toggleMarket(market.id)}
                      >
                        {code}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="welcome-muted">관심 시장 설정을 읽지 못했습니다. 설정 탭에서 정할 수 있습니다.</p>
              )}
              <p className="welcome-muted">
                저장하면 고른 시장의 뉴스를 바로 모으기 시작합니다. 몇 분 걸리고, 그동안에도 다른
                화면을 쓸 수 있습니다.
              </p>
            </>
          )}

          {step === "done" && (
            <>
              <h1 id="welcomeTitle" tabIndex={-1}>이제 시작할 수 있습니다</h1>
              {collecting && <p>뉴스를 모으고 있습니다. 상단 진행 표시에서 상태를 볼 수 있습니다.</p>}
              <ol className="welcome-next">
                <li><strong>워치리스트</strong>에 관심 종목을 넣으면 그 종목 뉴스가 모입니다.</li>
                <li><strong>브리핑</strong>에서 오늘의 시장을 정리합니다. 자료가 쌓일수록 좋아집니다.</li>
                <li><strong>기업 분석</strong>에 티커를 넣으면 공시와 숫자로 보고서를 만듭니다.</li>
              </ol>
              {location && (
                <>
                  <p className="welcome-path"><b>자료 저장 위치</b> · {location.path}</p>
                  {!location.outsideAppFolder && (
                    <p className="welcome-muted">
                      새 버전은 새 폴더로 풀립니다. 설정 &gt; 자료 위치에서 옮겨두면 업데이트할 때
                      그대로 이어집니다.
                    </p>
                  )}
                </>
              )}
            </>
          )}

          {note && <p className="react-dashboard-warning" role="status">{note}</p>}
        </section>

        <footer className="welcome-actions">
          <button className="welcome-skip" type="button" onClick={() => void finish(step !== "done")} disabled={!!busy}>
            {step === "done" ? "닫기" : "건너뛰기"}
          </button>
          <div className="welcome-acts">
            {index > 0 && step !== "done" && (
              <button className="welcome-btn" type="button" onClick={() => goto(STEPS[index - 1])} disabled={!!busy}>
                이전
              </button>
            )}
            {step === "welcome" && (
              <button className="welcome-btn welcome-btn--go" type="button" onClick={() => goto("engine")}>다음</button>
            )}
            {step === "engine" && (
              <button className="welcome-btn welcome-btn--go" type="button" onClick={() => void saveEngine()} disabled={!!busy}>
                {busy === "engine" ? "저장 중" : "저장하고 다음"}
              </button>
            )}
            {step === "markets" && (
              <button className="welcome-btn welcome-btn--go" type="button" onClick={() => void saveMarkets()} disabled={!!busy}>
                {busy === "markets" ? "저장 중" : "저장하고 시작"}
              </button>
            )}
            {step === "done" && (
              <button className="welcome-btn welcome-btn--go" type="button" onClick={() => void finish(false)} disabled={!!busy}>
                시작하기
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
