import type { OfficeObjectDefinition, OfficeObjectId, OfficeObjectSummary } from "./types";

export const OFFICE_OBJECTS: readonly OfficeObjectDefinition[] = [
  {
    id: "news_desk",
    label: "뉴스 데스크",
    shortLabel: "Evidence",
    description: "RSS와 research inbox의 최신 수집 상태를 확인합니다.",
    source: "Research Index · RSS",
    route: "#/rss",
    panel: "status",
    zone: "news",
    symbol: "N",
  },
  {
    id: "market_board",
    label: "시장 상황판",
    shortLabel: "Market",
    description: "Market Memory가 정리한 중기 시장 판단과 freshness를 확인합니다.",
    source: "Market Memory",
    route: "#/market-memory",
    panel: "status",
    zone: "market",
    symbol: "M",
  },
  {
    id: "research_desk",
    label: "리서치 책상",
    shortLabel: "Research",
    description: "기업 분석과 딥 리서치 작업 상태를 확인합니다.",
    source: "Company Analysis · Topic Report",
    route: "#/deep-research",
    panel: "status",
    zone: "research",
    symbol: "R",
  },
  {
    id: "report_shelf",
    label: "보고서 서가",
    shortLabel: "Reports",
    description: "최근 브리핑과 기업 분석 보고서를 다시 엽니다.",
    source: "Saved Reports",
    route: "#/briefing",
    panel: "reports",
    zone: "reports",
    symbol: "S",
  },
  {
    id: "memo_board",
    label: "메모 보드",
    shortLabel: "Notes",
    description: "Folio 투자 메모의 개수와 최근 변경 시각을 확인합니다.",
    source: "Native Investment Notes",
    route: "#/briefing",
    panel: "status",
    zone: "memo",
    symbol: "T",
  },
  {
    id: "portfolio_monitor",
    label: "포트폴리오 모니터",
    shortLabel: "Personal",
    description: "보유·관심 항목의 존재 여부만 compact 상태로 확인합니다.",
    source: "Local Portfolio · Watchlist",
    route: "#/watchlist",
    panel: "status",
    zone: "portfolio",
    symbol: "P",
  },
  {
    id: "agent_seat",
    label: "Agent 자리",
    shortLabel: "Agent",
    description: "같은 Agent 대화, 제안과 최근 작업을 이어서 사용합니다.",
    source: "Agent Jobs",
    route: "#/home",
    panel: "agent",
    zone: "agent",
    symbol: "A",
  },
] as const;

export const OFFICE_OBJECT_IDS = OFFICE_OBJECTS.map((item) => item.id);

export function officeObjectById(id: OfficeObjectId) {
  return OFFICE_OBJECTS.find((item) => item.id === id) || OFFICE_OBJECTS[0];
}

export function fallbackOfficeObjects(state: OfficeObjectSummary["state"] = "unavailable"): OfficeObjectSummary[] {
  return OFFICE_OBJECTS.map((item) => ({
    id: item.id,
    state,
    summary: state === "loading" ? "상태를 불러오는 중입니다." : "현재 상태를 불러오지 못했습니다.",
    count: 0,
    asOf: "",
    stale: false,
    notice: state === "loading" ? "" : "직접 화면은 계속 사용할 수 있습니다.",
  }));
}

