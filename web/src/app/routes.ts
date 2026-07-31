export type RouteId =
  | "office"
  | "home"
  | "dashboard"
  | "briefing"
  | "rss"
  | "market-memory"
  | "analysis"
  | "deep-research"
  | "watchlist"
  | "settings";

export type AppRoute = {
  id: RouteId;
  label: string;
  group: "home" | "research" | "portfolio" | "system";
  visibleInNav?: boolean;
};

export const ROUTES: AppRoute[] = [
  // Pixel Office는 보류 상태다. 런타임과 에셋은 보존하되 사용자 화면에는 노출하지 않는다.
  // #/office 직접 진입만 살려두어 코드가 죽지 않게 한다.
  { id: "office", label: "Pixel Office", group: "home", visibleInNav: false },
  { id: "home", label: "홈", group: "home" },
  { id: "dashboard", label: "대시보드", group: "home" },
  { id: "briefing", label: "브리핑", group: "research" },
  { id: "rss", label: "RSS 피드", group: "research" },
  { id: "market-memory", label: "시장 내러티브", group: "research" },
  { id: "analysis", label: "기업 분석", group: "research" },
  { id: "deep-research", label: "딥 리서치", group: "research" },
  { id: "watchlist", label: "워치리스트", group: "home" },
  { id: "settings", label: "설정", group: "system" },
];

export const NAV_ROUTES = ROUTES.filter((route) => route.visibleInNav !== false);

const DEFAULT_ROUTE: RouteId = "home";

export function parseHashRoute(hash: string): RouteId {
  const cleaned = hash.replace(/^#\/?/, "").split("/")[0];
  return ROUTES.some((route) => route.id === cleaned) ? (cleaned as RouteId) : DEFAULT_ROUTE;
}

export function toHash(routeId: RouteId): string {
  return `#/${routeId}`;
}

export function routeById(routeId: RouteId): AppRoute {
  return ROUTES.find((route) => route.id === routeId) ?? ROUTES[0];
}
