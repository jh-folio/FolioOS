import { useCallback, useEffect, useMemo, useState } from "react";
import { getJson, postJson, putJson } from "../api";
import { setReactAgentContextScope } from "./agentContext";
import { useUiPreferences } from "./homePreference";
import { RouteHero } from "./RouteHero";
import { useThemePreference, type ThemePreference } from "./themePreference";
import { WorkLogMigrationControl } from "./WorkLogMigration";

type ProviderId = "openai" | "gemini" | "claude";
type SettingsTab = "integrations" | "admin";

type ModelChoice = { value: string; label: string };

type LlmProvider = {
  label?: string;
  hasApiKey?: boolean;
  apiKeyMasked?: string;
  model?: string;
  modelChoices?: ModelChoice[];
  setupUrl?: string;
};

type SettingsPayload = {
  agent?: {
    enabled?: boolean;
    mode?: "cli" | "api";
  };
  llm?: {
    provider?: ProviderId;
    providers?: Record<string, LlmProvider>;
  };
  dart?: { hasApiKey?: boolean; apiKeyMasked?: string };
  fred?: { hasApiKey?: boolean; apiKeyMasked?: string };
  bok?: { hasApiKey?: boolean; apiKeyMasked?: string };
  notion?: { hasToken?: boolean; tokenMasked?: string; hasDb?: boolean; dbIdMasked?: string; dbId?: string };
};

type AgentAdapter = {
  id: string;
  label?: string;
  installed?: boolean;
  available?: boolean;
  authenticated?: boolean;
  bridgeSupported?: boolean;
  error?: string;
  model?: string;
  modelChoices?: ModelChoice[];
  docsUrl?: string;
  installSupported?: boolean;
  loginSupported?: boolean;
};

type AgentSettings = {
  provider?: string;
  selectedAdapter?: string;
  adapters?: AgentAdapter[];
};

type AutomationSettings = {
  rss?: { enabled?: boolean; intervalMinutes?: number | string; saveFullText?: boolean };
  marketMemory?: { enabled?: boolean; intervalMinutes?: number | string; runAfterRss?: boolean };
  briefing?: {
    enabled?: boolean;
    time?: string;
    marketScope?: string;
    briefingType?: string;
    runPrerequisites?: boolean;
  };
};

type LlmTestResult = {
  label?: string;
  status?: string;
  available?: boolean;
  message?: string;
};

type ObsidianSettings = { vaultPath?: string };
type CacheStats = {
  stats?: Array<{ directory?: string; files?: number; total_mb?: number; stale_files?: number; stale_mb?: number; max_age_days?: number }>;
  total_mb?: number;
  stale_mb?: number;
};
type CacheCleanup = {
  deleted?: number;
  freed_mb?: number;
  details?: Array<{ path?: string; age_days?: number }>;
};

const API_PROVIDERS: ProviderId[] = ["openai", "gemini", "claude"];

const PROVIDER_LABELS: Record<ProviderId, { name: string; key: string; model: string }> = {
  openai: { name: "OpenAI", key: "sk-...", model: "gpt-5.5" },
  gemini: { name: "Gemini", key: "AIza...", model: "gemini-3.5-flash" },
  claude: { name: "Claude", key: "sk-ant-...", model: "claude-sonnet-5" },
};

function providerOrDefault(value?: string): ProviderId {
  return API_PROVIDERS.includes(value as ProviderId) ? (value as ProviderId) : "openai";
}

/** loadAll이 저장된 모델을 선택지 목록에 맞춰 정규화하는 것과 같은 규칙.
 *  dirty 판정 기준선도 같은 규칙으로 계산해야 "불러오자마자 dirty"가 되지 않는다. */
function normalizedChoice(model: string | undefined, choices: ModelChoice[] | undefined): string {
  const list = choices || [];
  return list.some((choice) => choice.value === model) ? String(model || "") : list[0]?.value || "";
}

function statusText(hasValue: boolean | undefined, masked: string | undefined, emptyText: string, label: string) {
  return hasValue ? `${label} 저장됨: ${masked || "저장됨"}` : emptyText;
}

function adapterStatus(adapter: AgentAdapter) {
  if (adapter.bridgeSupported === false) return "지원 안 됨";
  if (!adapter.installed) return "미설치";
  if (adapter.authenticated || adapter.available) return "사용 가능";
  return "로그인 필요";
}

function adapterStatusClass(adapter: AgentAdapter) {
  if (adapter.bridgeSupported === false) return "warn";
  if (adapter.authenticated || adapter.available) return "ready";
  if (adapter.installed) return "warn";
  return "";
}

function ToggleSwitch({
  checked,
  onChange,
  label,
  ariaLabel,
  compact = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  ariaLabel?: string;
  compact?: boolean;
}) {
  return (
    <label className={`settings-switch${compact ? " settings-switch-compact" : ""}${checked ? " is-on" : ""}`}>
      <input
        aria-label={ariaLabel || label || "설정 전환"}
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
        type="checkbox"
      />
      <span className="settings-switch-track" aria-hidden="true"><span className="settings-switch-thumb" /></span>
      {label ? (
        <span className="settings-switch-copy">
          <strong>{label}</strong>
          <small>{checked ? "ON" : "OFF"}</small>
        </span>
      ) : (
        <span className="settings-switch-state" aria-hidden="true">{checked ? "ON" : "OFF"}</span>
      )}
    </label>
  );
}

function buildAutomationPayload(form: AutomationSettings): AutomationSettings {
  return {
    rss: {
      enabled: Boolean(form.rss?.enabled),
      intervalMinutes: form.rss?.intervalMinutes || 60,
      saveFullText: form.rss?.saveFullText !== false,
    },
    marketMemory: {
      enabled: Boolean(form.marketMemory?.enabled),
      intervalMinutes: form.marketMemory?.intervalMinutes || 1440,
      runAfterRss: Boolean(form.marketMemory?.runAfterRss),
    },
    briefing: {
      enabled: Boolean(form.briefing?.enabled),
      time: form.briefing?.time || "08:00",
      marketScope: form.briefing?.marketScope || "both",
      briefingType: form.briefing?.briefingType || "default",
      runPrerequisites: Boolean(form.briefing?.runPrerequisites),
    },
  };
}

// 수동 생성 화면(BriefingRoute)과 같은 문구를 쓴다. 두 화면이 다른 이름으로
// 같은 유형을 부르면 자동 브리핑이 무엇으로 나오는지 알 수 없다.
const AUTOMATION_BRIEFING_TYPES: Record<string, string> = {
  default: "기본",
  market_focused: "시황 중심",
  concise: "요약",
};

type MarketScopeState = {
  readonly selected: readonly string[];
  readonly markets: ReadonlyArray<{ readonly id: string; readonly label: string }>;
  readonly enabledAt: Readonly<Record<string, string>>;
};

/** 관심 시장 — 필터가 아니라 제품의 바깥 테두리.
 *
 *  여기서 끈 시장은 RSS 수집이 멈추고, 목록·브리핑 선택지·캘린더·내러티브
 *  세그먼트에서 사라진다. 다시 켜면 그 시장 피드를 즉시 수집하지만, RSS는
 *  피드가 내어주는 최근 항목까지만 받을 수 있어 꺼져 있던 기간의 공백이
 *  남을 수 있다 — 그 한계를 화면이 먼저 말한다.
 */
function MarketScopePanel() {
  const [scope, setScope] = useState<MarketScopeState | null>(null);
  const [draft, setDraft] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const payload = await getJson<MarketScopeState>("/api/market-scope");
        if (cancelled) return;
        setScope(payload);
        setDraft([...payload.selected]);
      } catch {
        if (!cancelled) setNote("관심 시장 설정을 불러오지 못했습니다.");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!scope) return null;

  const toggle = (id: string) => {
    setDraft((current) => {
      const next = current.includes(id) ? current.filter((v) => v !== id) : [...current, id];
      // 전부 끄면 남는 화면이 없다. 마지막 하나는 끄지 않는다.
      return next.length ? scope.markets.map((m) => m.id).filter((m) => next.includes(m)) : current;
    });
  };

  const dirty = JSON.stringify(draft) !== JSON.stringify([...scope.selected]);

  const save = async () => {
    if (!dirty) {
      setNote("변경 사항이 없습니다.");
      return;
    }
    setBusy(true);
    setNote("");
    try {
      const payload = await putJson<MarketScopeState & { newlyEnabled?: string[]; collectionJob?: unknown }>(
        "/api/market-scope",
        { selected: draft },
      );
      setScope(payload);
      setDraft([...payload.selected]);
      const enabled = payload.newlyEnabled || [];
      setNote(enabled.length
        ? "저장했습니다. 방금 켠 시장의 자료 수집을 시작했습니다 — 꺼져 있던 기간의 기사는 피드가 아직 내어주는 범위까지만 들어옵니다."
        : "저장했습니다.");
    } catch (err) {
      setNote(err instanceof Error ? err.message : "저장하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="settings-panel input-panel" data-qa="market-scope-panel">
      <div className="input-panel-header">
        <div>
          <h3>관심 시장</h3>
          <p>여기서 끈 시장은 자료 수집이 멈추고 화면 전체(RSS·브리핑·캘린더·내러티브)에서 숨습니다. 유가·달러 같은 글로벌 자료는 항상 보입니다.</p>
        </div>
      </div>
      <div className="field">
        <span id="marketScopeLabel">수집·표시할 시장</span>
        <div className="settings-theme-options" role="group" aria-labelledby="marketScopeLabel">
          {scope.markets.map((market) => (
            <button
              type="button"
              key={market.id}
              aria-pressed={draft.includes(market.id)}
              disabled={busy}
              onClick={() => toggle(market.id)}
            >
              {market.label}
            </button>
          ))}
        </div>
      </div>
      <div className="settings-actions">
        {dirty && !busy && <span className="settings-dirty-hint">저장 안 된 변경</span>}
        <button className={dirty && !busy ? "btn btn--primary" : "btn"} type="button" onClick={() => void save()} disabled={busy}>
          {busy ? "저장 중" : "저장"}
        </button>
      </div>
      {note && <p className="react-dashboard-warning" role="status">{note}</p>}
    </section>
  );
}

type WorkspaceState = {
  readonly path: string;
  readonly appFolder: string;
  readonly outsideAppFolder: boolean;
  readonly fileCount: number;
  readonly totalBytes: number;
  readonly documentsPath: string;
  readonly documentsAvailable: boolean;
  readonly documentsIsOneDrive: boolean;
  readonly envPinned: boolean;
  readonly canMoveToDocuments: boolean;
  readonly canMoveToAppFolder: boolean;
};

function humanBytes(size: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let value = Math.max(0, size);
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return unit === 0 ? `${Math.round(value)} B` : `${value.toFixed(1)} ${units[unit]}`;
}

/** 자료 위치 — 새 버전을 받았을 때 자료가 따라오게 하는 설정.
 *
 *  배포 zip은 버전이 박힌 폴더로 풀리고 `data/`는 빈 채로 나온다. 그래서 새 버전을
 *  받으면 이전 자료는 옛 폴더에 남는다. 자료를 앱 폴더 밖으로 옮겨두면 새 버전이
 *  그 폴더를 다시 찾는다. **옮겨도 원본은 지우지 않는다.**
 */
function WorkspacePanel() {
  const [state, setState] = useState<WorkspaceState | null>(null);
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState<"documents" | "app" | "">("");

  const load = useCallback(async () => {
    try {
      setState(await getJson<WorkspaceState>("/api/workspace"));
    } catch {
      setNote("자료 위치를 읽지 못했습니다.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (!state) return null;

  const move = async (destination: "documents" | "app", merge: boolean) => {
    setBusy(destination);
    setNote("");
    try {
      const result = await postJson<{ path: string; previousPath: string; fileCount: number }>(
        "/api/workspace/move",
        { destination, merge },
      );
      setConfirming("");
      await load();
      setNote(
        `자료 ${result.fileCount}개를 ${result.path}(으)로 복사했습니다. ` +
        `서버를 재시작해야 새 위치를 사용합니다. 원본은 ${result.previousPath}에 그대로 있으니 ` +
        "새 위치에서 자료가 잘 보이는지 확인한 뒤 지우세요.",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "옮기지 못했습니다.";
      if (message.includes("이미 자료")) setConfirming(destination);
      setNote(message);
    } finally {
      setBusy("");
    }
  };

  const reveal = async () => {
    setBusy("reveal");
    try {
      await postJson("/api/workspace/reveal", {});
    } catch (err) {
      setNote(err instanceof Error ? err.message : "폴더를 열지 못했습니다.");
    } finally {
      setBusy("");
    }
  };

  return (
    <section className="settings-panel input-panel" data-qa="workspace-panel">
      <div className="input-panel-header">
        <div>
          <h3>자료 위치</h3>
          <p>
            보고서·수집 자료·설정이 저장되는 폴더입니다. 새 버전은 버전 이름이 붙은 새 폴더로
            풀리기 때문에, 자료가 앱 폴더 안에 있으면 업데이트할 때 직접 옮겨야 합니다.
          </p>
        </div>
      </div>

      <div className="field">
        <span id="workspacePathLabel">지금 쓰는 폴더</span>
        <p className="workspace-path" aria-labelledby="workspacePathLabel">{state.path}</p>
        <p className="settings-hint">
          자료 {state.fileCount.toLocaleString()}개 · {humanBytes(state.totalBytes)}
          {state.outsideAppFolder
            ? " · 앱 폴더 밖에 있어 새 버전을 받아도 그대로 이어집니다."
            : " · 앱 폴더 안에 있습니다."}
        </p>
      </div>

      {state.envPinned && (
        <p className="settings-hint">
          FOLIO_HOME 환경변수가 이 위치를 정하고 있습니다. 여기서 옮기려면 환경변수를 먼저 지우세요.
        </p>
      )}

      {state.documentsIsOneDrive && state.canMoveToDocuments && (
        <p className="react-dashboard-warning" role="status">
          문서 폴더가 OneDrive와 동기화됩니다. 자료에는 700MB가 넘는 검색 인덱스가 있어 저장할
          때마다 업로드가 돌고, 두 PC에서 함께 쓰면 충돌 사본이 생길 수 있습니다.
        </p>
      )}

      <div className="settings-actions">
        <button
          className="btn"
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("folio:show-welcome"))}
        >
          첫 실행 안내 다시 보기
        </button>
        <button className="btn" type="button" onClick={() => void reveal()} disabled={!!busy}>
          {busy === "reveal" ? "여는 중" : "폴더 열기"}
        </button>
        {state.canMoveToDocuments && state.documentsAvailable && (
          <button
            className="btn btn--primary"
            type="button"
            onClick={() => void move("documents", confirming === "documents")}
            disabled={!!busy}
          >
            {busy === "documents"
              ? "복사 중"
              : confirming === "documents"
                ? "그래도 합치기"
                : "문서 폴더로 옮기기"}
          </button>
        )}
        {state.canMoveToAppFolder && (
          <button
            className="btn"
            type="button"
            onClick={() => void move("app", confirming === "app")}
            disabled={!!busy}
          >
            {busy === "app" ? "복사 중" : confirming === "app" ? "그래도 합치기" : "앱 폴더로 되돌리기"}
          </button>
        )}
      </div>

      {state.canMoveToDocuments && state.documentsAvailable && (
        <p className="settings-hint">
          옮길 위치: {state.documentsPath} · 복사만 하고 원본은 지우지 않습니다.
        </p>
      )}
      {note && <p className="react-dashboard-warning" role="status">{note}</p>}
    </section>
  );
}

export function SettingsRoute() {
  const theme = useThemePreference();
  const uiPreferences = useUiPreferences();
  // 관리(화면·관심 시장·자동화)가 먼저다. 연동은 한 번 설정하면 다시 열 일이 적다.
  const [tab, setTab] = useState<SettingsTab>("admin");
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [agentSettings, setAgentSettings] = useState<AgentSettings | null>(null);
  const [automation, setAutomation] = useState<AutomationSettings>({});
  // 자동화 폼은 서버 응답을 그대로 편집하므로, dirty 판정용 기준선을 따로 든다.
  const [automationSaved, setAutomationSaved] = useState<AutomationSettings>({});
  const [obsidian, setObsidian] = useState<ObsidianSettings>({});
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [provider, setProvider] = useState<ProviderId>("openai");
  const [providerApiKey, setProviderApiKey] = useState("");
  const [providerModel, setProviderModel] = useState("");
  const [agentEnabled, setAgentEnabled] = useState(true);
  const [agentMode, setAgentMode] = useState<"cli" | "api">("cli");
  const [agentProvider, setAgentProvider] = useState("codex");
  const [agentModel, setAgentModel] = useState("");
  const [apiDraft, setApiDraft] = useState({ fred: "", bok: "", dart: "" });
  const [notionDraft, setNotionDraft] = useState({ token: "", dbId: "" });
  const [vaultPath, setVaultPath] = useState("");
  const [llmStatus, setLlmStatus] = useState<Record<string, LlmTestResult & { checking?: boolean }>>({});
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const providers = settings?.llm?.providers || {};
  const selectedProvider = providers[provider] || {};
  const selectedProviderMeta = PROVIDER_LABELS[provider];
  const providerChoices = selectedProvider.modelChoices || [];
  const agentAdapters = agentSettings?.adapters || [];
  const selectedAgent = agentAdapters.find((adapter) => adapter.id === agentProvider) || agentAdapters[0];
  const selectedAgentChoices = selectedAgent?.modelChoices || [];

  // dirty→primary (2026-08-08 확정): 변경이 생긴 패널의 저장 버튼만 진해지고,
  // 진한 버튼이 곧 "저장 안 된 변경"의 신호다. disabled로 잠그지 않는다.
  const baselineAgentProvider = ["codex", "claude", "antigravity"].includes(agentSettings?.provider || "")
    ? String(agentSettings?.provider)
    : String(agentSettings?.selectedAdapter || agentAdapters[0]?.id || "codex");
  const baselineAdapter = agentAdapters.find((adapter) => adapter.id === baselineAgentProvider) || agentAdapters[0];
  const agentDirty =
    agentEnabled !== (settings?.agent?.enabled !== false) ||
    agentMode !== (settings?.agent?.mode === "api" ? "api" : "cli") ||
    agentProvider !== baselineAgentProvider ||
    agentModel !== normalizedChoice(baselineAdapter?.model, baselineAdapter?.modelChoices) ||
    provider !== providerOrDefault(settings?.llm?.provider) ||
    providerModel !== normalizedChoice(selectedProvider.model, selectedProvider.modelChoices) ||
    providerApiKey.trim() !== "";
  const apiDirty = Boolean(apiDraft.fred.trim() || apiDraft.bok.trim() || apiDraft.dart.trim());
  const notionDirty =
    Boolean(notionDraft.token.trim()) || notionDraft.dbId.trim() !== String(settings?.notion?.dbId || "").trim();
  const obsidianDirty = vaultPath.trim() !== String(obsidian.vaultPath || "").trim();
  const automationDirty =
    JSON.stringify(buildAutomationPayload(automation)) !== JSON.stringify(buildAutomationPayload(automationSaved));

  const loadAll = useCallback(async (refreshAgent = false) => {
    setError("");
    setBusy("load");
    try {
      const [settingsPayload, agentPayload, automationPayload, obsidianPayload] = await Promise.all([
        getJson<SettingsPayload>(`/api/settings${refreshAgent ? "?refresh=true" : ""}`),
        getJson<AgentSettings>(`/api/agent-bridge/settings${refreshAgent ? "?refresh=true" : ""}`),
        getJson<AutomationSettings>("/api/automation/settings"),
        getJson<ObsidianSettings>("/api/obsidian/settings"),
      ]);
      setSettings(settingsPayload);
      setAgentEnabled(settingsPayload.agent?.enabled !== false);
      setAgentMode(settingsPayload.agent?.mode === "api" ? "api" : "cli");
      const nextProvider = providerOrDefault(settingsPayload.llm?.provider);
      setProvider(nextProvider);
      const nextProviderData = settingsPayload.llm?.providers?.[nextProvider] || {};
      const nextProviderChoices = nextProviderData.modelChoices || [];
      setProviderModel(nextProviderChoices.some((choice) => choice.value === nextProviderData.model)
        ? String(nextProviderData.model || "")
        : nextProviderChoices[0]?.value || "");
      setNotionDraft({ token: "", dbId: settingsPayload.notion?.dbId || "" });

      setAgentSettings(agentPayload);
      const nextAgentProvider = ["codex", "claude", "antigravity"].includes(agentPayload.provider || "")
        ? String(agentPayload.provider)
        : String(agentPayload.selectedAdapter || agentPayload.adapters?.[0]?.id || "codex");
      const nextAgent = agentPayload.adapters?.find((adapter) => adapter.id === nextAgentProvider) || agentPayload.adapters?.[0];
      setAgentProvider(nextAgentProvider);
      const nextAgentChoices = nextAgent?.modelChoices || [];
      setAgentModel(nextAgentChoices.some((choice) => choice.value === nextAgent?.model)
        ? String(nextAgent?.model || "")
        : nextAgentChoices[0]?.value || "");
      window.dispatchEvent(new CustomEvent("folio:agent-settings-updated", { detail: agentPayload }));

      setAutomation(buildAutomationPayload(automationPayload));
      setAutomationSaved(buildAutomationPayload(automationPayload));
      setObsidian(obsidianPayload);
      setVaultPath(obsidianPayload.vaultPath || "");
      setReactAgentContextScope("settings", { surface: "settings", viewId: "settings", reportKind: "", reportId: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "설정을 불러오지 못했습니다.");
    } finally {
      setBusy("");
    }
  }, []);

  const loadCacheStats = useCallback(async () => {
    setBusy("cache");
    setError("");
    try {
      const payload = await getJson<CacheStats>("/api/cache/stats");
      setCacheStats(payload);
      setStatus("캐시 상태를 불러왔습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "캐시 상태를 불러오지 못했습니다.");
    } finally {
      setBusy("");
    }
  }, []);

  async function cleanupCache() {
    setBusy("cache-cleanup");
    setError("");
    setStatus("오래된 기업 데이터 캐시를 정리하는 중입니다.");
    try {
      const result = await postJson<CacheCleanup>("/api/cache/cleanup", {});
      const statsPayload = await getJson<CacheStats>("/api/cache/stats");
      setCacheStats(statsPayload);
      // 0개 삭제만 적으면 고장인지 지울 게 없는 것인지 알 수 없다.
      setStatus(result.deleted
        ? `캐시 정리 완료: ${result.deleted}개 삭제, ${result.freed_mb || 0}MB 확보`
        : "정리할 오래된 캐시가 없습니다. 보관 기간이 지난 파일만 지웁니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "캐시 정리에 실패했습니다.");
    } finally {
      setBusy("");
    }
  }

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const current = providers[provider] || {};
    const choices = current.modelChoices || [];
    setProviderModel((previous) => choices.some((choice) => choice.value === previous)
      ? previous
      : choices.some((choice) => choice.value === current.model)
        ? String(current.model || "")
        : choices[0]?.value || "");
    setProviderApiKey("");
  }, [provider, providers]);

  useEffect(() => {
    const adapter = agentAdapters.find((item) => item.id === agentProvider) || agentAdapters[0];
    const choices = adapter?.modelChoices || [];
    setAgentModel((previous) => choices.some((choice) => choice.value === previous)
      ? previous
      : choices.some((choice) => choice.value === adapter?.model)
        ? String(adapter?.model || "")
        : choices[0]?.value || "");
  }, [agentProvider, agentAdapters]);

  async function saveAiAgentSettings() {
    if (!agentDirty) {
      setStatus("변경 사항이 없습니다.");
      return;
    }
    setBusy("agent");
    setStatus("AI Agent 설정을 저장하는 중입니다.");
    try {
      const models = Object.fromEntries(agentAdapters.map((adapter) => [adapter.id, adapter.model || ""]));
      models[agentProvider] = agentModel;
      const [agentPayload, settingsPayload] = await Promise.all([
        postJson<AgentSettings>("/api/agent-bridge/settings", { provider: agentProvider, models }),
        postJson<SettingsPayload>("/api/settings", {
          agent: { enabled: agentEnabled, mode: agentMode },
          llm: {
            provider,
            providers: {
              [provider]: { apiKey: providerApiKey.trim(), model: providerModel },
            },
          },
        }),
      ]);
      setAgentSettings(agentPayload);
      setSettings(settingsPayload);
      setProviderApiKey("");
      setLlmStatus((current) => {
        const next = { ...current };
        delete next[provider];
        return next;
      });
      window.dispatchEvent(new CustomEvent("folio:agent-settings-updated", { detail: agentPayload }));
      setStatus(agentEnabled
        ? `AI Agent를 ${agentMode === "cli" ? "LLM CLI" : "LLM API"} 모드로 저장했습니다.`
        : "AI Agent 생성을 비활성화했습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI Agent 설정 저장에 실패했습니다.");
    } finally {
      setBusy("");
    }
  }

  async function testProvider(providerId: ProviderId) {
    // 키 없이 눌러도 버튼은 눌리게 두고, 빠진 것을 그 자리에서 말한다(§4 disabled 금지).
    if (!providers[providerId]?.hasApiKey) {
      setLlmStatus((current) => ({
        ...current,
        [providerId]: { status: "missing_key", available: false, message: "API 키를 먼저 입력하세요" },
      }));
      return;
    }
    setLlmStatus((current) => ({ ...current, [providerId]: { checking: true } }));
    try {
      const result = await postJson<LlmTestResult>(`/api/settings/llm/test/${encodeURIComponent(providerId)}`, {});
      setLlmStatus((current) => ({ ...current, [providerId]: result }));
    } catch (err) {
      setLlmStatus((current) => ({
        ...current,
        [providerId]: { status: "network_error", available: false, message: err instanceof Error ? err.message : "연결 확인 실패" },
      }));
    }
  }

  async function saveApiSettings() {
    if (!apiDirty) {
      setStatus("변경 사항이 없습니다.");
      return;
    }
    setBusy("api");
    setStatus("외부 데이터 API 설정을 저장하는 중입니다.");
    try {
      const payload = await postJson<SettingsPayload>("/api/settings", {
        fred: { apiKey: apiDraft.fred.trim() },
        bok: { apiKey: apiDraft.bok.trim() },
        dart: { apiKey: apiDraft.dart.trim() },
      });
      setSettings(payload);
      setApiDraft({
        fred: "",
        bok: "",
        dart: "",
      });
      setStatus("외부 데이터 API 설정을 저장했습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "API 설정 저장에 실패했습니다.");
    } finally {
      setBusy("");
    }
  }

  async function saveNotionSettings() {
    if (!notionDirty) {
      setStatus("변경 사항이 없습니다.");
      return;
    }
    setBusy("notion");
    setStatus("Notion 설정을 저장하는 중입니다.");
    try {
      const payload = await postJson<SettingsPayload>("/api/settings", {
        notion: { token: notionDraft.token.trim(), dbId: notionDraft.dbId.trim() },
      });
      setSettings(payload);
      setNotionDraft({ token: "", dbId: payload.notion?.dbId || "" });
      setStatus("Notion 설정을 저장했습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Notion 설정 저장에 실패했습니다.");
    } finally {
      setBusy("");
    }
  }

  async function saveObsidianSettings() {
    if (!obsidianDirty) {
      setStatus("변경 사항이 없습니다.");
      return;
    }
    setBusy("obsidian");
    setStatus("Obsidian 경로를 저장하는 중입니다.");
    try {
      const payload = await postJson<ObsidianSettings>("/api/obsidian/settings", { vaultPath: vaultPath.trim() });
      setObsidian(payload);
      setVaultPath(payload.vaultPath || vaultPath);
      setStatus(payload.vaultPath ? "Obsidian 경로를 저장했습니다." : "Vault 경로를 입력하세요.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Obsidian 설정 저장에 실패했습니다.");
    } finally {
      setBusy("");
    }
  }

  async function saveAutomationSettings() {
    if (!automationDirty) {
      setStatus("변경 사항이 없습니다.");
      return;
    }
    setBusy("automation");
    setStatus("자동화 설정을 저장하는 중입니다.");
    try {
      const payload = await postJson<AutomationSettings>("/api/automation/settings", buildAutomationPayload(automation));
      setAutomation(buildAutomationPayload(payload));
      setAutomationSaved(buildAutomationPayload(payload));
      setStatus("자동화 설정을 저장했습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "자동화 설정 저장에 실패했습니다.");
    } finally {
      setBusy("");
    }
  }

  const providerRows = useMemo(() => API_PROVIDERS.map((providerId) => {
    const row = providers[providerId] || {};
    const result = llmStatus[providerId];
    const checking = result?.checking;
    const label = checking ? "확인 중" : result?.available ? "사용 가능" : result ? "확인 실패" : row.hasApiKey ? "확인 필요" : "키 없음";
    const className = result?.available ? "ready" : checking || result ? "warn" : "";
    const detail = result?.message || `${row.model || "모델 미설정"} · ${row.hasApiKey ? "저장된 키가 있습니다." : "API Key를 저장하세요."}`;
    return { providerId, row, label, className, detail };
  }), [llmStatus, providers]);

  return (
    <div className="react-settings-route" data-settings-route>
      <RouteHero
        eyebrow="Settings"
        title="설정"
        description="화면, 관심 시장, 자동화와 LLM·외부 데이터·내보내기 연동을 관리합니다."
        actions={(
        <button className="btn" type="button" onClick={() => loadAll(true)} disabled={busy === "load"}>
          {busy === "load" ? "불러오는 중" : "새로고침"}
        </button>
        )}
      />

      <nav className="sub-tabs" aria-label="설정 하위 탭">
        <button aria-current={tab === "admin" ? "page" : undefined} type="button" onClick={() => setTab("admin")}>관리</button>
        <button aria-current={tab === "integrations" ? "page" : undefined} type="button" onClick={() => setTab("integrations")}>연동</button>
      </nav>

      {error && <p className="react-dashboard-error">{error}</p>}
      {status && <p className="react-dashboard-warning">{status}</p>}

      {tab === "integrations" ? (
        <div id="settings-integrations" className="sub-tab-panel active">
          <section className="settings-panel input-panel">
            <div className="input-panel-header settings-agent-header">
              <div>
                <h3>AI Agent 설정</h3>
                <p>보고서와 시장 내러티브 생성에 사용할 Agent 경로를 선택합니다. 비활성화하면 규칙 기반으로 생성합니다.</p>
              </div>
            </div>
            <div className="settings-grid">
              <div className="field">
                <span>실행 방식</span>
                <div className="settings-agent-mode-row">
                  <ToggleSwitch ariaLabel="AI Agent 사용" checked={agentEnabled} onChange={setAgentEnabled} compact />
                  <div className="segment" role="group" aria-label="AI Agent 실행 방식">
                    <button aria-pressed={agentMode === "cli"} type="button" onClick={() => setAgentMode("cli")}>LLM CLI</button>
                    <button aria-pressed={agentMode === "api"} type="button" onClick={() => setAgentMode("api")}>LLM API</button>
                  </div>
                </div>
                {!agentEnabled && (
                  <p className="settings-hint">AI Agent가 꺼져 있어요. 켜면 아래 설정을 쓸 수 있습니다.</p>
                )}
              </div>
            </div>

            <fieldset className="settings-agent-controls" disabled={!agentEnabled}>

            {agentMode === "cli" ? (
              <>
                <div className="settings-grid">
                  <label className="field">
                    <span>사용할 CLI</span>
                    <select value={agentProvider} onChange={(event) => setAgentProvider(event.currentTarget.value)}>
                      {(agentAdapters.length ? agentAdapters : [{ id: "codex", label: "Codex CLI" }, { id: "claude", label: "Claude Code CLI" }, { id: "antigravity", label: "Antigravity CLI" }]).map((adapter) => (
                        <option value={adapter.id} key={adapter.id}>{adapter.label || adapter.id}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>모델</span>
                    <select value={agentModel} onChange={(event) => setAgentModel(event.currentTarget.value)}>
                      {selectedAgentChoices.length ? selectedAgentChoices.map((choice) => (
                        <option value={choice.value} key={choice.value}>{choice.label}</option>
                      )) : <option value="">모델 목록 없음</option>}
                    </select>
                  </label>
                </div>
                <div className="cli-provider-list" aria-live="polite">
                  {agentAdapters.map((adapter) => (
                    <div className="cli-provider-row" key={adapter.id}>
                      <div className="cli-provider-main">
                        <div className="cli-provider-head">
                          <strong>{adapter.label || adapter.id}</strong>
                          <span className={`cli-chip status-chip ${adapterStatusClass(adapter)}`}>{adapterStatus(adapter)}</span>
                        </div>
                        <div className="cli-provider-meta">{adapter.bridgeSupported === false ? adapter.error || "현재 환경에서 사용할 수 없습니다." : adapter.model || "모델 미설정"}</div>
                      </div>
                      {adapter.docsUrl && <a className="btn" href={adapter.docsUrl} target="_blank" rel="noreferrer">문서</a>}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <label className="field">
                  <span>API 제공자</span>
                  <select value={provider} onChange={(event) => setProvider(providerOrDefault(event.currentTarget.value))}>
                    <option value="openai">GPT / OpenAI</option>
                    <option value="gemini">Gemini / Google</option>
                    <option value="claude">Claude / Anthropic</option>
                  </select>
                </label>
                <div className="settings-grid">
                  <label className="field">
                    <span>{selectedProviderMeta.name} API Key</span>
                    <input value={providerApiKey} onChange={(event) => setProviderApiKey(event.currentTarget.value)} type="password" autoComplete="off" placeholder={selectedProvider.hasApiKey ? `${selectedProvider.apiKeyMasked} 저장됨` : selectedProviderMeta.key} />
                  </label>
                  <label className="field">
                    <span>{selectedProviderMeta.name} Model</span>
                    <select value={providerModel} onChange={(event) => setProviderModel(event.currentTarget.value)}>
                      {providerChoices.length ? providerChoices.map((choice) => (
                        <option value={choice.value} key={choice.value}>{choice.label}</option>
                      )) : <option value="">모델 목록 없음</option>}
                    </select>
                  </label>
                </div>
                <div className="cli-provider-list" aria-live="polite">
                  {providerRows.map(({ providerId, row, label, className, detail }) => (
                    <div className="cli-provider-row" key={providerId}>
                      <div className="cli-provider-main">
                        <div className="cli-provider-head">
                          <strong>{row.label || PROVIDER_LABELS[providerId].name}</strong>
                          <span className={`cli-chip status-chip ${className}`}>{label}</span>
                        </div>
                        <div className="cli-provider-meta">{detail}</div>
                      </div>
                      <div className="cli-provider-actions">
                        <button className="btn" type="button" disabled={Boolean(llmStatus[providerId]?.checking)} onClick={() => testProvider(providerId)}>연결 확인</button>
                        {row.setupUrl && <a className="btn" href={row.setupUrl} target="_blank" rel="noreferrer">API Key 발급</a>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            </fieldset>
            <div className="filter-actions settings-actions">
              {agentDirty && !busy && <span className="settings-dirty-hint">저장 안 된 변경</span>}
              <button className={agentDirty && !busy ? "btn btn--primary" : "btn"} type="button" onClick={saveAiAgentSettings} disabled={busy === "agent"}>AI Agent 설정 저장</button>
              <button className="btn" type="button" onClick={() => loadAll(true)} disabled={busy === "load"}>모델/상태 새로고침</button>
            </div>
          </section>

          <section className="settings-panel input-panel">
            <div className="input-panel-header"><h3>API 연동</h3><p>외부 데이터 API 키를 설정합니다.</p></div>
            <div className="settings-grid">
              <label className="field"><span>FRED API Key</span><input value={apiDraft.fred} onChange={(event) => setApiDraft({ ...apiDraft, fred: event.currentTarget.value })} type="password" autoComplete="off" placeholder={settings?.fred?.hasApiKey ? `${settings.fred.apiKeyMasked} 저장됨` : "FRED API 키"} /></label>
              <div className="field"><span>FRED 상태</span><p className="section-subtitle">{statusText(settings?.fred?.hasApiKey, settings?.fred?.apiKeyMasked, "딥 리서치 미국 경제지표용 FRED API 키가 없습니다.", "FRED API 키")}</p></div>
            </div>
            <div className="settings-grid">
              <label className="field"><span>BOK API Key</span><input value={apiDraft.bok} onChange={(event) => setApiDraft({ ...apiDraft, bok: event.currentTarget.value })} type="password" autoComplete="off" placeholder={settings?.bok?.hasApiKey ? `${settings.bok.apiKeyMasked} 저장됨` : "BOK ECOS API 키"} /></label>
              <div className="field"><span>BOK 상태</span><p className="section-subtitle">{statusText(settings?.bok?.hasApiKey, settings?.bok?.apiKeyMasked, "딥 리서치 한국 경제지표용 BOK API 키가 없습니다.", "BOK API 키")}</p></div>
            </div>
            <div className="settings-grid">
              <label className="field"><span>DART API Key</span><input value={apiDraft.dart} onChange={(event) => setApiDraft({ ...apiDraft, dart: event.currentTarget.value })} type="password" autoComplete="off" placeholder={settings?.dart?.hasApiKey ? `${settings.dart.apiKeyMasked} 저장됨` : "OpenDART API 키"} /></label>
              <div className="field"><span>DART 상태</span><p className="section-subtitle">{statusText(settings?.dart?.hasApiKey, settings?.dart?.apiKeyMasked, "국내 기업 분석용 DART API 키가 없습니다.", "DART API 키")}</p></div>
            </div>
            <div className="filter-actions settings-actions">
              {apiDirty && !busy && <span className="settings-dirty-hint">저장 안 된 변경</span>}
              <button className={apiDirty && !busy ? "btn btn--primary" : "btn"} type="button" onClick={saveApiSettings} disabled={busy === "api"}>API 설정 저장</button>
            </div>
          </section>

          <section className="settings-panel input-panel">
            <div className="input-panel-header"><h3>Notion 연동</h3><p>브리핑과 보고서를 Notion 데이터베이스로 내보냅니다.</p></div>
            <div className="settings-grid">
              <label className="field"><span>Notion 통합 토큰</span><input value={notionDraft.token} onChange={(event) => setNotionDraft({ ...notionDraft, token: event.currentTarget.value })} type="password" autoComplete="off" placeholder={settings?.notion?.hasToken ? `${settings.notion.tokenMasked} 저장됨` : "ntn_..."} /></label>
              <div className="field"><span>토큰 상태</span><p className="section-subtitle">{settings?.notion?.hasToken ? `토큰 저장됨: ${settings.notion.tokenMasked}` : "Notion 통합 토큰이 없습니다."}</p></div>
            </div>
            <div className="settings-grid">
              <label className="field"><span>데이터베이스 ID</span><input value={notionDraft.dbId} onChange={(event) => setNotionDraft({ ...notionDraft, dbId: event.currentTarget.value })} placeholder="32자리 Database ID" /></label>
              <div className="field"><span>DB 상태</span><p className="section-subtitle">{settings?.notion?.hasDb ? `DB 저장됨: ${settings.notion.dbIdMasked}` : "Notion 데이터베이스 ID가 없습니다."}</p></div>
            </div>
            <div className="filter-actions settings-actions">
              {notionDirty && !busy && <span className="settings-dirty-hint">저장 안 된 변경</span>}
              <button className={notionDirty && !busy ? "btn btn--primary" : "btn"} type="button" onClick={saveNotionSettings} disabled={busy === "notion"}>Notion 설정 저장</button>
            </div>
          </section>

          <section className="settings-panel input-panel">
            <div className="input-panel-header"><h3>Obsidian 연동</h3><p>원하면 Obsidian Vault로 보고서와 노트를 내보낼 수 있습니다.</p></div>
            <div className="settings-grid">
              <label className="field"><span>Vault 폴더 경로</span><input value={vaultPath} onChange={(event) => setVaultPath(event.currentTarget.value)} type="text" placeholder="C:\Users\username\Documents\MyVault" /></label>
              <div className="field"><span>경로 상태</span><p className="section-subtitle">{obsidian.vaultPath ? `설정됨: ${obsidian.vaultPath}` : "Vault 경로가 설정되지 않았습니다."}</p></div>
            </div>
            <div className="filter-actions settings-actions">
              {obsidianDirty && !busy && <span className="settings-dirty-hint">저장 안 된 변경</span>}
              <button className={obsidianDirty && !busy ? "btn btn--primary" : "btn"} type="button" onClick={saveObsidianSettings} disabled={busy === "obsidian"}>Obsidian 설정 저장</button>
            </div>
          </section>
        </div>
      ) : (
        <div id="settings-admin" className="sub-tab-panel active">
          <section className="settings-panel input-panel" data-display-settings>
            <div className="input-panel-header">
              <div>
                <h3>화면</h3>
                <p>이 브라우저의 색상 모드와 움직임 방식을 저장합니다.</p>
              </div>
              <span className="settings-theme-status" aria-live="polite">
                현재 {theme.resolved === "dark" ? "다크" : "라이트"}
              </span>
            </div>
            <div className="field">
              <span id="themePreferenceLabel">테마</span>
              <div className="settings-theme-options" role="group" aria-labelledby="themePreferenceLabel">
                {([
                  ["light", "라이트"],
                  ["dark", "다크"],
                  ["system", "시스템"],
                ] as Array<[ThemePreference, string]>).map(([value, label]) => (
                  <button
                    type="button"
                    aria-pressed={theme.preference === value}
                    onClick={() => theme.setPreference(value)}
                    key={value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="settings-grid">
              <label className="field">
                <span>움직임</span>
                <select
                  value={uiPreferences.preferences.motion}
                  onChange={(event) => uiPreferences.setMotion(event.currentTarget.value === "reduced" ? "reduced" : "system")}
                >
                  <option value="system">시스템 설정 따르기</option>
                  <option value="reduced">움직임 줄이기</option>
                </select>
              </label>
            </div>
          </section>

          <MarketScopePanel />

          <WorkspacePanel />

          <section className="settings-panel input-panel">
            <div className="input-panel-header"><h3>자동화</h3><p>수집, 중기 시장 정리, 브리핑 생성을 각각 독립 루틴으로 관리합니다.</p></div>
            <div className="automation-routines">
              <section className="automation-card">
                <div className="automation-card-head">
                  <div>
                    <span>RSS Collection</span>
                    <strong>RSS 수집</strong>
                    <p>뉴스 피드를 정해진 간격으로 가져와 research inbox와 인덱스에 반영합니다.</p>
                  </div>
                  <ToggleSwitch ariaLabel="RSS 자동 수집" checked={Boolean(automation.rss?.enabled)} onChange={(checked) => setAutomation({ ...automation, rss: { ...automation.rss, enabled: checked } })} compact />
                </div>
                <label className="field"><span>수집 간격</span><select value={String(automation.rss?.intervalMinutes || 60)} onChange={(event) => setAutomation({ ...automation, rss: { ...automation.rss, intervalMinutes: event.currentTarget.value } })}><option value="15">15분마다</option><option value="30">30분마다</option><option value="60">1시간마다</option><option value="180">3시간마다</option></select></label>
                <div className="automation-inline-switch"><span>기사 전문 저장 (무료 공개 본문만, 로컬 보관용)</span><ToggleSwitch ariaLabel="기사 전문 저장" checked={automation.rss?.saveFullText !== false} onChange={(checked) => setAutomation({ ...automation, rss: { ...automation.rss, saveFullText: checked } })} compact /></div>
              </section>

              <section className="automation-card">
                <div className="automation-card-head">
                  <div>
                    <span>Market Memory</span>
                    <strong>시장 메모리 업데이트</strong>
                    <p>최근 RSS와 시장 자료를 중기 시장 판단용 컨텍스트로 정리합니다.</p>
                  </div>
                  <ToggleSwitch ariaLabel="Market Memory 자동 정리" checked={Boolean(automation.marketMemory?.enabled)} onChange={(checked) => setAutomation({ ...automation, marketMemory: { ...automation.marketMemory, enabled: checked } })} compact />
                </div>
                <label className="field"><span>정리 간격</span><select value={String(automation.marketMemory?.intervalMinutes || 1440)} onChange={(event) => setAutomation({ ...automation, marketMemory: { ...automation.marketMemory, intervalMinutes: event.currentTarget.value } })}><option value="720">12시간마다</option><option value="1440">하루마다</option><option value="2880">이틀마다</option><option value="10080">일주일마다</option></select></label>
                <div className="automation-inline-switch"><span>RSS 수집 직후에도 정리</span><ToggleSwitch ariaLabel="RSS 수집 직후 Market Memory 정리" checked={Boolean(automation.marketMemory?.runAfterRss)} onChange={(checked) => setAutomation({ ...automation, marketMemory: { ...automation.marketMemory, runAfterRss: checked } })} compact /></div>
              </section>

              <section className="automation-card">
                <div className="automation-card-head">
                  <div>
                    <span>Daily Briefing</span>
                    <strong>브리핑 생성</strong>
                    <p>지정한 시각에 RSS와 Market Memory를 반영해 일일 브리핑을 생성합니다.</p>
                  </div>
                  <ToggleSwitch ariaLabel="일일 브리핑 자동 생성" checked={Boolean(automation.briefing?.enabled)} onChange={(checked) => setAutomation({ ...automation, briefing: { ...automation.briefing, enabled: checked } })} compact />
                </div>
                <div className="settings-grid compact">
                  <label className="field"><span>브리핑 시각</span><input value={automation.briefing?.time || "08:00"} onChange={(event) => setAutomation({ ...automation, briefing: { ...automation.briefing, time: event.currentTarget.value } })} type="time" /></label>
                  <label className="field"><span>시장 범위</span><select value={automation.briefing?.marketScope || "both"} onChange={(event) => setAutomation({ ...automation, briefing: { ...automation.briefing, marketScope: event.currentTarget.value } })}><option value="all">전체(미국+한국+유럽+일본)</option><option value="both">미국+한국</option><option value="us">미국</option><option value="kr">한국</option><option value="europe">유럽</option><option value="jp">일본</option></select></label>
                  <label className="field"><span>브리핑 유형</span><select value={automation.briefing?.briefingType || "default"} onChange={(event) => setAutomation({ ...automation, briefing: { ...automation.briefing, briefingType: event.currentTarget.value } })}>{Object.entries(AUTOMATION_BRIEFING_TYPES).map(([value, label]) => (<option value={value} key={value}>{label}</option>))}</select></label>
                </div>
                <div className="automation-inline-switch"><span>브리핑 전 RSS/Memory 실행</span><ToggleSwitch ariaLabel="브리핑 전 RSS와 Market Memory 실행" checked={Boolean(automation.briefing?.runPrerequisites)} onChange={(checked) => setAutomation({ ...automation, briefing: { ...automation.briefing, runPrerequisites: checked } })} compact /></div>
              </section>
            </div>
            <div className="filter-actions settings-actions">
              {automationDirty && !busy && <span className="settings-dirty-hint">저장 안 된 변경</span>}
              <button className={automationDirty && !busy ? "btn btn--primary" : "btn"} type="button" onClick={saveAutomationSettings} disabled={busy === "automation"}>자동화 저장</button>
            </div>
          </section>
          <section className="settings-panel input-panel">
            <div className="input-panel-header">
              <div>
                <h3>캐시 관리</h3>
                <p>기업 분석용 SEC/DART per-company 캐시 중 오래된 항목만 정리합니다. 공통 ticker/corpCode 목록은 삭제하지 않습니다.</p>
              </div>
              <button className="btn" type="button" onClick={loadCacheStats} disabled={busy === "cache"}>
                {busy === "cache" ? "확인 중" : "상태 확인"}
              </button>
            </div>
            <div className="cache-summary">
              <section>
                <span>전체 캐시</span>
                <strong>{cacheStats ? `${cacheStats.total_mb || 0} MB` : "상태 미확인"}</strong>
              </section>
              <section>
                <span>정리 대상</span>
                <strong>{cacheStats ? `${cacheStats.stale_mb || 0} MB` : "상태 미확인"}</strong>
              </section>
            </div>
            {cacheStats?.stats?.length ? (
              <div className="cache-list">
                {cacheStats.stats.map((row) => (
                  <div className="cache-row" key={row.directory || "cache"}>
                    <strong>{row.directory}</strong>
                    <span>{row.files || 0}개 · {row.total_mb || 0}MB</span>
                    <small>오래된 항목 {row.stale_files || 0}개 · 보관 {row.max_age_days || 0}일</small>
                  </div>
                ))}
              </div>
            ) : (
              <p className="section-subtitle">상태 확인을 누르면 캐시 사용량을 확인합니다.</p>
            )}
            <div className="filter-actions settings-actions">
              <button className="btn" type="button" onClick={cleanupCache} disabled={busy === "cache-cleanup"}>
                {busy === "cache-cleanup" ? "정리 중" : "오래된 캐시 정리"}
              </button>
            </div>
          </section>
          <section className="settings-panel input-panel">
            <div className="input-panel-header">
              <div>
                <h3>이전 작업 기록</h3>
                <p>예전 버전이 남긴 작업 기록 파일을 현재 저장소로 한 번만 옮깁니다. 보고서와 제안 파일은 건드리지 않습니다.</p>
              </div>
            </div>
            <WorkLogMigrationControl />
          </section>
        </div>
      )}
    </div>
  );
}
