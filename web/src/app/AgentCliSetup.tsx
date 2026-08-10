import { useRef, useState } from "react";
import { getJson, postJson, type JobStatus } from "../api";
import {
  adapterActions,
  adapterDetail,
  adapterStatusClass,
  adapterStatusLabel,
  type AgentCliAdapter,
  type AgentCliSettings,
} from "./aiConnectionStatus";
import { pollAgentJobBounded } from "./agentPolling";

/** Agent CLI 설치·로그인·상태 한 벌.
 *
 *  **첫 실행 안내와 설정 탭이 같은 컴포넌트를 쓴다.** 안내에서만 되고 설정에서는 안 되면
 *  안내가 내내 반복하는 "나중에 설정에서 바꿀 수 있습니다"가 거짓이 된다.
 *
 *  `POST /api/agent-bridge/install|login`은 오래전부터 있었지만 **부르는 화면이 없었다.**
 *  안내는 "설정 탭의 AI Agent에서 설치와 로그인을 마칠 수 있습니다"라고 적어 뒀는데 설정
 *  탭에도 그 버튼이 없어, 처음 쓰는 사람이 CLI를 고르면 갈 곳이 없었다.
 *
 *  경계 셋을 화면이 먼저 말한다:
 *  - 설치는 **Windows에서만** 된다(`installSupported`를 서버가 그렇게 내려준다). 다른 OS는
 *    공식 문서 링크로 보낸다.
 *  - 로그인은 **별도 콘솔 창**이 열린다(`launch_login()`이 `CREATE_NEW_CONSOLE`). 브라우저
 *    안에서 끝나는 일이 아니라는 것을 누르기 전에 알려야 한다.
 *  - 상태 새로고침은 CLI마다 모델 목록까지 다시 물어 오래 걸린다.
 */

export type { AgentCliAdapter, AgentCliSettings } from "./aiConnectionStatus";

type InstallJob = { id: string; status: JobStatus; message?: string; error?: string };

/** 설치 스크립트는 서버가 최대 600초를 준다. 폴링이 먼저 포기하면 화면만 실패로 보인다. */
const INSTALL_POLL_TIMEOUT_MS = 620_000;

export function AgentCliSetup({
  adapters,
  onSettings,
  disabled = false,
}: {
  adapters: AgentCliAdapter[];
  onSettings: (payload: AgentCliSettings) => void;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const [progress, setProgress] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  function publish(payload: AgentCliSettings) {
    onSettings(payload);
    // 상단바 `Agent CLI` 메뉴와 다른 화면이 같은 값을 봐야 한다.
    window.dispatchEvent(new CustomEvent("folio:agent-settings-updated", { detail: payload }));
  }

  async function refresh() {
    setBusy("refresh");
    setNote("");
    try {
      publish(await getJson<AgentCliSettings>("/api/agent-bridge/settings?refresh=true"));
    } catch (err) {
      setNote(err instanceof Error ? err.message : "상태를 확인하지 못했습니다.");
    } finally {
      setBusy("");
    }
  }

  async function install(adapter: AgentCliAdapter) {
    setBusy(`install:${adapter.id}`);
    setNote("");
    setProgress("공식 설치 스크립트를 실행하고 있습니다.");
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    try {
      const job = await postJson<InstallJob>(`/api/agent-bridge/install/${encodeURIComponent(adapter.id)}`, {});
      await pollAgentJobBounded(job, {
        signal: controller.signal,
        timeoutMs: INSTALL_POLL_TIMEOUT_MS,
        onUpdate: (current) => setProgress(current.message || ""),
      });
      // 설치 결과를 믿지 않고 다시 잰다. 설치가 끝나도 로그인은 아직 남아 있다.
      publish(await getJson<AgentCliSettings>("/api/agent-bridge/settings?refresh=true"));
      setNote(`${adapter.label || adapter.id} 설치가 끝났습니다. 이어서 로그인하세요.`);
    } catch (err) {
      setNote(err instanceof Error ? err.message : "설치하지 못했습니다.");
    } finally {
      setProgress("");
      setBusy("");
    }
  }

  async function login(adapter: AgentCliAdapter) {
    setBusy(`login:${adapter.id}`);
    setNote("");
    try {
      await postJson(`/api/agent-bridge/login/${encodeURIComponent(adapter.id)}`, {});
      setNote("로그인 창을 열었습니다. 창에서 로그인을 마친 뒤 상태 새로고침을 누르세요.");
    } catch (err) {
      setNote(err instanceof Error ? err.message : "로그인 창을 열지 못했습니다.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="cli-setup">
      <div className="cli-provider-list" aria-live="polite">
        {adapters.length === 0 && <p className="cli-setup-note">CLI 상태를 확인하는 중입니다.</p>}
        {adapters.map((adapter) => {
          const acts = adapterActions(adapter);
          const installing = busy === `install:${adapter.id}`;
          return (
            <div className="cli-provider-row" key={adapter.id}>
              <div className="cli-provider-main">
                <div className="cli-provider-head">
                  <strong>{adapter.label || adapter.id}</strong>
                  <span className={`cli-chip status-chip ${adapterStatusClass(adapter)}`}>
                    {adapterStatusLabel(adapter)}
                  </span>
                </div>
                <div className="cli-provider-meta">{installing ? progress || "설치 중" : adapterDetail(adapter)}</div>
              </div>
              <div className="cli-provider-actions">
                {acts.install === "button" && (
                  <button
                    className="btn"
                    type="button"
                    disabled={disabled || Boolean(busy)}
                    onClick={() => void install(adapter)}
                  >
                    {installing ? "설치 중" : "설치"}
                  </button>
                )}
                {acts.install === "docs" && (
                  <a className="btn" href={adapter.docsUrl} target="_blank" rel="noreferrer">설치 방법</a>
                )}
                {acts.login && (
                  <button
                    className="btn"
                    type="button"
                    disabled={disabled || Boolean(busy)}
                    onClick={() => void login(adapter)}
                  >
                    {busy === `login:${adapter.id}` ? "여는 중" : "로그인"}
                  </button>
                )}
                {acts.docs && (
                  <a className="btn" href={adapter.docsUrl} target="_blank" rel="noreferrer">문서</a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="cli-setup-foot">
        <button className="btn" type="button" disabled={disabled || Boolean(busy)} onClick={() => void refresh()}>
          {busy === "refresh" ? "확인 중" : "상태 새로고침"}
        </button>
        <p className="cli-setup-note">
          설치는 공식 스크립트를 실행하며 Windows에서만 됩니다. 로그인은 <b>별도 콘솔 창</b>에서
          진행되고, 마친 뒤 상태 새로고침을 눌러야 반영됩니다. 새로고침은 CLI마다 모델 목록까지
          다시 물어 시간이 걸립니다.
        </p>
      </div>

      {note && <p className="cli-setup-note cli-setup-note--result" role="status">{note}</p>}
    </div>
  );
}
