import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
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
 */

type MarketScopeState = {
  readonly selected: ReadonlyArray<string>;
  readonly markets: ReadonlyArray<{ readonly id: string; readonly label: string }>;
};

type WorkspaceLocation = { readonly path: string; readonly outsideAppFolder: boolean };

type StepId = "welcome" | "engine" | "markets" | "done";

const STEPS: ReadonlyArray<{ id: StepId; label: string }> = [
  { id: "welcome", label: "환영" },
  { id: "engine", label: "AI" },
  { id: "markets", label: "관심 시장" },
  { id: "done", label: "시작" },
];

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
  const [engineSaved, setEngineSaved] = useState(false);

  const [scope, setScope] = useState<MarketScopeState | null>(null);
  const [markets, setMarkets] = useState<string[]>([]);
  const [collecting, setCollecting] = useState(false);

  const [location, setLocation] = useState<WorkspaceLocation | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const payload = await getJson<MarketScopeState>("/api/market-scope");
        setScope(payload);
        setMarkets([...payload.selected]);
      } catch {
        /* 안내를 못 띄울 이유는 아니다. 이 단계는 건너뛸 수 있다. */
      }
      try {
        setLocation(await getJson<WorkspaceLocation>("/api/workspace"));
      } catch {
        /* 위와 같다. */
      }
    })();
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
      setEngineSaved(true);
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
  const cardRef = useRef<HTMLDivElement | null>(null);

  const focusables = () => Array.from(
    cardRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    ) ?? [],
  );

  useEffect(() => {
    // 단계가 바뀌면 새 내용의 처음으로 포커스를 옮긴다. 그러지 않으면 이전 단계에서
    // 누른 버튼이 사라진 자리에 포커스가 남아 body로 떨어진다.
    cardRef.current?.querySelector<HTMLElement>("h1")?.focus();
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
    if (event.shiftKey && (active === first || !cardRef.current?.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const index = STEPS.findIndex((item) => item.id === step);

  return (
    <div
      className="welcome-shell"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcomeTitle"
      ref={cardRef}
      onKeyDown={onKeyDown}
    >
      <div className="welcome-card surface">
        <header className="welcome-head">
          <FolioWordmark />
          <ol className="welcome-steps" aria-label="진행 단계">
            {STEPS.map((item, position) => (
              <li
                key={item.id}
                className="welcome-step"
                aria-current={item.id === step ? "step" : undefined}
                data-state={position < index ? "done" : position === index ? "current" : "todo"}
              >
                {item.label}
              </li>
            ))}
          </ol>
        </header>

        {step === "welcome" && (
          <section className="welcome-body">
            <h1 id="welcomeTitle" tabIndex={-1}>Folio OS를 시작합니다</h1>
            <p>
              뉴스·공시·리포트를 이 PC에 모아 읽고, 매일 브리핑과 기업 분석을 만드는 개인
              리서치 작업실입니다. 자료와 보고서는 전부 이 컴퓨터에만 저장됩니다.
            </p>
            <p className="welcome-muted">
              두 가지만 정하면 바로 쓸 수 있습니다 — AI를 쓸지, 어느 시장을 볼지. 둘 다
              나중에 설정에서 바꿀 수 있습니다.
            </p>
            <div className="field">
              <span id="welcomeThemeLabel">화면 테마</span>
              <div className="settings-theme-options" role="group" aria-labelledby="welcomeThemeLabel">
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
            </div>
          </section>
        )}

        {step === "engine" && (
          <section className="welcome-body">
            <h1 id="welcomeTitle" tabIndex={-1}>AI를 쓰시겠어요?</h1>
            <p>
              브리핑·기업 분석·테마 분석 문장을 AI가 씁니다.{" "}
              <strong>AI가 없어도 앱은 그대로 동작합니다</strong> — 자료 수집·검색·차트는
              모두 규칙으로 만들고, 보고서도 규칙 기반으로 나옵니다. 문장이 더 거칠 뿐입니다.
            </p>
            <div className="field">
              <span id="welcomeEngineLabel">생성 방식</span>
              <div className="settings-theme-options" role="group" aria-labelledby="welcomeEngineLabel">
                <button type="button" aria-pressed={engine === "none"} onClick={() => setEngine("none")}>
                  AI 없이
                </button>
                <button type="button" aria-pressed={engine === "api"} onClick={() => setEngine("api")}>
                  API 키
                </button>
                <button type="button" aria-pressed={engine === "cli"} onClick={() => setEngine("cli")}>
                  Agent CLI
                </button>
              </div>
            </div>

            {engine === "api" && (
              <>
                <div className="field">
                  <span id="welcomeProviderLabel">제공사</span>
                  <div className="settings-theme-options" role="group" aria-labelledby="welcomeProviderLabel">
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
                </div>
                <label className="field">
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
                  <a href={PROVIDERS.find((item) => item.id === provider)?.url} target="_blank" rel="noreferrer">
                    {PROVIDERS.find((item) => item.id === provider)?.label} 키 페이지
                  </a>
                </p>
              </>
            )}

            {engine === "cli" && (
              <p className="welcome-muted">
                이미 쓰고 있는 Codex·Claude·Antigravity CLI를 그대로 씁니다. 설정 탭의 AI Agent에서
                설치와 로그인을 마칠 수 있습니다. CLI는 한 번 실행에 수십 초가 걸립니다.
              </p>
            )}
          </section>
        )}

        {step === "markets" && (
          <section className="welcome-body">
            <h1 id="welcomeTitle" tabIndex={-1}>어느 시장을 보시겠어요?</h1>
            <p>
              여기서 끈 시장은 자료 수집이 멈추고 화면 전체에서 숨습니다. 유가·달러 같은
              글로벌 자료는 항상 보입니다. 나중에 설정에서 바꿀 수 있습니다.
            </p>
            {scope ? (
              <div className="field">
                <span id="welcomeMarketLabel">수집·표시할 시장</span>
                <div className="settings-theme-options" role="group" aria-labelledby="welcomeMarketLabel">
                  {scope.markets.map((market) => (
                    <button
                      type="button"
                      key={market.id}
                      aria-pressed={markets.includes(market.id)}
                      onClick={() => toggleMarket(market.id)}
                    >
                      {market.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="welcome-muted">관심 시장 설정을 읽지 못했습니다. 설정 탭에서 정할 수 있습니다.</p>
            )}
            <p className="welcome-muted">
              저장하면 고른 시장의 뉴스를 바로 모으기 시작합니다. 몇 분 걸리고, 그동안에도
              다른 화면을 쓸 수 있습니다.
            </p>
          </section>
        )}

        {step === "done" && (
          <section className="welcome-body">
            <h1 id="welcomeTitle" tabIndex={-1}>준비됐습니다</h1>
            {collecting && <p>뉴스를 모으고 있습니다. 상단 진행 표시에서 상태를 볼 수 있습니다.</p>}
            <ul className="welcome-next">
              <li><strong>워치리스트</strong>에 관심 종목을 넣으면 그 종목 뉴스가 모입니다.</li>
              <li><strong>브리핑</strong>에서 오늘의 시장 정리를 만듭니다. 자료가 쌓일수록 좋아집니다.</li>
              <li><strong>기업 분석</strong>에 티커를 넣으면 SEC 공시와 숫자로 보고서를 만듭니다.</li>
            </ul>
            {location && (
              <p className="welcome-muted">
                자료 저장 위치: <code>{location.path}</code>
                {!location.outsideAppFolder && (
                  <> — 새 버전은 새 폴더로 풀리니, 업데이트 전에 설정 &gt; 자료 위치에서 옮겨두면 편합니다.</>
                )}
              </p>
            )}
          </section>
        )}

        {note && <p className="react-dashboard-warning" role="status">{note}</p>}

        <footer className="welcome-actions">
          <button
            className="btn"
            type="button"
            onClick={() => void finish(step !== "done")}
            disabled={!!busy}
          >
            {step === "done" ? "닫기" : "건너뛰기"}
          </button>
          <div className="welcome-actions-main">
            {index > 0 && step !== "done" && (
              <button
                className="btn"
                type="button"
                onClick={() => goto(STEPS[index - 1].id)}
                disabled={!!busy}
              >
                이전
              </button>
            )}
            {step === "welcome" && (
              <button className="btn btn--primary" type="button" onClick={() => goto("engine")}>
                다음
              </button>
            )}
            {step === "engine" && (
              <button className="btn btn--primary" type="button" onClick={() => void saveEngine()} disabled={!!busy}>
                {busy === "engine" ? "저장 중" : engineSaved ? "다음" : "저장하고 다음"}
              </button>
            )}
            {step === "markets" && (
              <button className="btn btn--primary" type="button" onClick={() => void saveMarkets()} disabled={!!busy}>
                {busy === "markets" ? "저장 중" : "저장하고 시작"}
              </button>
            )}
            {step === "done" && (
              <button className="btn btn--primary" type="button" onClick={() => void finish(false)} disabled={!!busy}>
                시작하기
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
