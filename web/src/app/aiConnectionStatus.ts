/** AI 연결 상태 행이 무엇을 보여줄지 정하는 규칙 — Agent CLI와 API 제공사 양쪽.
 *
 *  컴포넌트에서 떼어 둔 이유는 이 판단이 **화면에서 확인하기 어렵기 때문**이다. 개발
 *  기계에는 CLI 셋이 모두 설치·로그인돼 있어 설치 버튼과 로그인 버튼이 아예 렌더되지
 *  않고, API 키가 하나도 없어 확인 시각도 붙지 않는다 — 정작 처음 쓰는 사람만 보는
 *  경로다. 순수 함수로 두고 테스트가 대신 본다.
 */

export type AgentCliAdapter = {
  id: string;
  label?: string;
  installed?: boolean;
  available?: boolean;
  authenticated?: boolean;
  bridgeSupported?: boolean;
  installSupported?: boolean;
  loginSupported?: boolean;
  error?: string;
  version?: string;
  model?: string;
  docsUrl?: string;
};

export type AgentCliSettings = {
  provider?: string;
  adapters?: AgentCliAdapter[];
};

/** 로그인까지 끝나 실제로 부를 수 있는 상태. `authenticated`가 없던 옛 응답도 받는다. */
export function adapterReady(adapter: AgentCliAdapter) {
  return Boolean(adapter.authenticated || adapter.available);
}

export function adapterStatusLabel(adapter: AgentCliAdapter) {
  if (adapter.bridgeSupported === false) return "지원 안 됨";
  if (!adapter.installed) return "미설치";
  return adapterReady(adapter) ? "사용 가능" : "로그인 필요";
}

export function adapterStatusClass(adapter: AgentCliAdapter) {
  if (adapter.bridgeSupported === false) return "warn";
  if (adapterReady(adapter)) return "ready";
  if (adapter.installed) return "warn";
  return "";
}

/** 행 아래 한 줄. 막힌 이유 > 버전 > 모델 순으로 급한 것을 먼저 낸다. */
export function adapterDetail(adapter: AgentCliAdapter) {
  if (adapter.error) return adapter.error;
  if (adapter.version) return adapter.version;
  if (!adapter.installed) return "설치되어 있지 않습니다.";
  return adapter.model || "모델 미설정";
}

export type AdapterActions = {
  /** `button`은 이 앱이 설치한다, `docs`는 직접 설치해야 한다, `none`은 이미 있다. */
  readonly install: "button" | "docs" | "none";
  readonly login: boolean;
  readonly docs: boolean;
};

export function adapterActions(adapter: AgentCliAdapter): AdapterActions {
  // 브리지가 막힌 어댑터(agy 1.1.7 미만 등)는 설치도 로그인도 답이 아니다. 사유만 보여주고
  // 문서로 보낸다 — 설치 버튼을 주면 눌러도 상황이 바뀌지 않는다.
  if (adapter.bridgeSupported === false) {
    return { install: "none", login: false, docs: Boolean(adapter.docsUrl) };
  }
  if (!adapter.installed) {
    // 웹 설치는 서버가 Windows에서만 열어 준다(`installSupported`). 나머지 OS는 공식 문서다.
    const install = adapter.installSupported ? "button" : adapter.docsUrl ? "docs" : "none";
    return { install, login: false, docs: false };
  }
  return { install: "none", login: !adapterReady(adapter), docs: Boolean(adapter.docsUrl) };
}


/** `2026-08-11T01:30:00Z` → `08.11 01:30`.
 *
 *  **언제 잰 값인지 모르면 상태를 믿을 수 없다.** `사용 가능`이 방금인지 지난주인지
 *  구분되지 않으면 확인 버튼을 누를 이유도 없어진다. 연도는 빼고 월·일·시각만 남긴다 —
 *  이 값에서 중요한 것은 날짜가 아니라 최근성이다.
 */
export function checkedAtLabel(value: string | undefined) {
  if (!value) return "";
  const when = new Date(value);
  if (Number.isNaN(when.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(when.getMonth() + 1)}.${pad(when.getDate())} ${pad(when.getHours())}:${pad(when.getMinutes())}`;
}
