import { describe, expect, it } from "vitest";
import {
  adapterActions,
  checkedAtLabel,
  adapterDetail,
  adapterStatusClass,
  adapterStatusLabel,
  type AgentCliAdapter,
} from "./aiConnectionStatus";

const base: AgentCliAdapter = { id: "codex", label: "Codex CLI", docsUrl: "https://example.test" };

describe("CLI 행이 무엇을 보여줄지", () => {
  it("설치되어 있지 않으면 Windows에서만 설치 버튼을 준다", () => {
    // 웹 설치는 서버가 `installSupported`로 Windows에서만 열어 준다. 다른 OS에 버튼을
    // 주면 눌러도 "웹 설치는 현재 Windows에서만 지원합니다"라는 오류만 돌아온다.
    expect(adapterActions({ ...base, installed: false, installSupported: true }))
      .toEqual({ install: "button", login: false, docs: false });
    expect(adapterActions({ ...base, installed: false, installSupported: false }))
      .toEqual({ install: "docs", login: false, docs: false });
  });

  it("설치는 됐는데 로그인이 안 됐으면 로그인 버튼을 준다", () => {
    expect(adapterActions({ ...base, installed: true, authenticated: false }))
      .toEqual({ install: "none", login: true, docs: true });
  });

  it("이미 쓸 수 있으면 아무 조치도 권하지 않는다", () => {
    expect(adapterActions({ ...base, installed: true, authenticated: true }).login).toBe(false);
    // 옛 응답에는 `authenticated`가 없고 `available`만 있었다.
    expect(adapterActions({ ...base, installed: true, available: true }).login).toBe(false);
  });

  it("브리지가 막힌 어댑터에는 설치도 로그인도 권하지 않는다", () => {
    // agy 1.1.7 미만은 설치돼 있어도 headless가 결과를 못 낸다. 버튼을 주면 눌러도
    // 상황이 바뀌지 않는다 — 사유를 보여주고 문서로 보낸다.
    expect(adapterActions({ ...base, installed: true, bridgeSupported: false, error: "agy 1.1.6..." }))
      .toEqual({ install: "none", login: false, docs: true });
  });

  it("문서 주소가 없으면 문서 버튼도 없다", () => {
    expect(adapterActions({ id: "codex", installed: false, installSupported: false }).install).toBe("none");
    expect(adapterActions({ id: "codex", installed: true, available: true }).docs).toBe(false);
  });
});

describe("상태 문구", () => {
  it("네 상태를 가른다", () => {
    expect(adapterStatusLabel({ ...base, bridgeSupported: false })).toBe("지원 안 됨");
    expect(adapterStatusLabel({ ...base, installed: false })).toBe("미설치");
    expect(adapterStatusLabel({ ...base, installed: true })).toBe("로그인 필요");
    expect(adapterStatusLabel({ ...base, installed: true, authenticated: true })).toBe("사용 가능");
  });

  it("색은 쓸 수 있을 때만 ready다", () => {
    expect(adapterStatusClass({ ...base, installed: true, authenticated: true })).toBe("ready");
    expect(adapterStatusClass({ ...base, installed: true })).toBe("warn");
    expect(adapterStatusClass({ ...base, bridgeSupported: false })).toBe("warn");
    expect(adapterStatusClass({ ...base, installed: false })).toBe("");
  });
});

describe("행 아래 한 줄", () => {
  it("막힌 이유 > 버전 > 모델 순으로 급한 것을 먼저 낸다", () => {
    expect(adapterDetail({ ...base, error: "버전이 낮습니다", version: "1.0.0" })).toBe("버전이 낮습니다");
    expect(adapterDetail({ ...base, installed: true, version: "1.1.7", model: "gpt" })).toBe("1.1.7");
    expect(adapterDetail({ ...base, installed: true, model: "gpt" })).toBe("gpt");
    expect(adapterDetail({ ...base, installed: false })).toBe("설치되어 있지 않습니다.");
    expect(adapterDetail({ ...base, installed: true })).toBe("모델 미설정");
  });
});

describe("마지막 확인 시각", () => {
  it("연도를 빼고 월·일·시각만 남긴다", () => {
    // 이 값에서 중요한 것은 날짜가 아니라 최근성이다. `사용 가능`이 방금인지 지난주인지
    // 구분되지 않으면 확인 버튼을 누를 이유도 없어진다.
    const iso = new Date(2026, 7, 11, 1, 30).toISOString();
    expect(checkedAtLabel(iso)).toBe("08.11 01:30");
  });

  it("없거나 읽을 수 없으면 아무것도 붙이지 않는다", () => {
    // 서버 확인을 거치지 않은 로컬 판정(키 없음)에는 시각이 없다. 빈 값을 그리면
    // "확인했다"고 읽힌다.
    expect(checkedAtLabel(undefined)).toBe("");
    expect(checkedAtLabel("")).toBe("");
    expect(checkedAtLabel("어제")).toBe("");
  });
});
