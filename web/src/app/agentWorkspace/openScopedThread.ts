import { openReactAgentDock } from "../agentContext";
import type { ConsultationSession } from "./types";

export type ScopedThreadRequest = {
  title?: string;
  scope: ConsultationSession["scope"];
  initialMessage?: string;
};

/**
 * 주제가 붙은 대화를 시작하며 도크를 연다.
 *
 * 도크가 대화의 집이다. 예전에는 별도 상담 패널이 떴는데, 같은 일을 하는 화면이
 * 둘이면 대화 목록도 둘로 갈린다. 주제는 별도 이름이 아니라 칩으로 보여준다.
 */
export function openScopedThread(request: ScopedThreadRequest) {
  window.dispatchEvent(new CustomEvent<ScopedThreadRequest>("folio:open-agent-thread", { detail: request }));
  openReactAgentDock({});
}
