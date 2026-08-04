import { useCallback, useEffect, useMemo, useState } from "react";
import { getJson, postJson } from "../../api";

type Event = {
  id: string; kind: string; title: string; startsAt: string; status: string;
  market?: string; tickers?: string[]; source?: string; sourceUrl?: string;
  allDay?: boolean; timezone?: string; importance?: number;
};
type FocusSymbol = { symbol: string; label?: string; source?: string };
type CalendarView = "week" | "month";

export const KIND_KO: Record<string, string> = {
  macro: "경제지표", central_bank: "중앙은행", holiday: "휴장", earnings: "실적", filing: "공시", dividend: "배당",
};
export const STATUS_KO: Record<string, string> = {
  confirmed: "확정", estimated: "추정", tentative: "미정", actual: "발표됨",
};
const KIND_FILTERS: Array<{ value: string; label: string }> = [
  { value: "all", label: "전체" }, { value: "earnings", label: "실적" }, { value: "macro", label: "지표" },
  { value: "central_bank", label: "중앙은행" }, { value: "holiday", label: "휴장" },
  { value: "filing", label: "공시" }, { value: "dividend", label: "배당" },
];
const DOW_KO = ["월", "화", "수", "목", "금", "토", "일"];
const DAY_MS = 24 * 60 * 60 * 1000;

function dateKey(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function eventDateKeyKST(event: Event): string {
  if (event.allDay || /^\d{4}-\d{2}-\d{2}$/.test(event.startsAt)) return event.startsAt.slice(0, 10);
  const date = new Date(event.startsAt);
  if (Number.isNaN(date.getTime())) return event.startsAt.slice(0, 10);
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function timeLabelKST(event: Pick<Event, "allDay" | "startsAt" | "kind">): string {
  if (event.allDay || /^\d{4}-\d{2}-\d{2}$/.test(event.startsAt)) return "종일";
  const date = new Date(event.startsAt);
  if (Number.isNaN(date.getTime())) return "—";
  if (event.kind === "earnings") {
    const et = new Intl.DateTimeFormat("en-GB", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
    if (et === "00:00") return "발표일";
    if (et < "09:30") return "장전";
    if (et >= "16:00") return "장후";
  }
  return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

function mondayOf(value: Date): Date {
  const date = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const offset = (date.getDay() + 6) % 7;
  return new Date(date.getTime() - offset * DAY_MS);
}

function shortChip(event: Event): string {
  if (event.kind === "earnings" && event.tickers?.length) return `${event.tickers[0]} · ${timeLabelKST(event)}`;
  return event.title.replace(/^(NYSE|KRX) 휴장 — /, "휴장 · ").slice(0, 22);
}

export function MarketCalendar({ focusSymbols }: { focusSymbols: FocusSymbol[] }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [view, setView] = useState<CalendarView>("week");
  const [kind, setKind] = useState("all");
  const [market, setMarket] = useState("all");
  const [watchOnly, setWatchOnly] = useState(false);
  const [anchor, setAnchor] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => dateKey(new Date()));
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const start = new Date(anchor.getTime() - 40 * DAY_MS);
    const end = new Date(anchor.getTime() + 70 * DAY_MS);
    try {
      const payload = await getJson<{ events?: Event[] }>(
        `/api/market-calendar?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}&limit=500`,
      );
      setEvents(payload.events || []);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "일정을 불러오지 못했습니다.");
    }
  }, [anchor]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    getJson<{ calendarView?: CalendarView; calendarKind?: string; calendarMarket?: string; calendarWatchlistOnly?: boolean }>("/api/dashboard/settings")
      .then((row) => {
        if (row.calendarView === "week" || row.calendarView === "month") setView(row.calendarView);
        if (row.calendarKind) setKind(row.calendarKind);
        if (row.calendarMarket) setMarket(row.calendarMarket);
        setWatchOnly(Boolean(row.calendarWatchlistOnly));
      })
      .catch(() => undefined);
  }, []);

  function persist(partial: Record<string, unknown>) {
    postJson("/api/dashboard/settings", partial).catch(() => undefined);
  }

  const watchSymbols = useMemo(
    () => new Set(focusSymbols.filter((row) => row.source !== "fallback").map((row) => row.symbol.toUpperCase())),
    [focusSymbols],
  );

  const filtered = useMemo(() => events.filter((event) => {
    if (kind !== "all" && event.kind !== kind) return false;
    if (market !== "all" && (event.market || "").toUpperCase() !== market) return false;
    if (watchOnly && !(event.tickers || []).some((t) => watchSymbols.has(t.toUpperCase()))) return false;
    return true;
  }), [events, kind, market, watchOnly, watchSymbols]);

  const byDay = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const event of filtered) {
      const key = eventDateKeyKST(event);
      map.set(key, [...(map.get(key) || []), event]);
    }
    for (const rows of map.values()) rows.sort((a, b) => (b.importance || 0) - (a.importance || 0) || a.startsAt.localeCompare(b.startsAt));
    return map;
  }, [filtered]);

  const weekStart = mondayOf(anchor);
  const weekDays = Array.from({ length: 7 }, (_, index) => new Date(weekStart.getTime() + index * DAY_MS));
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const monthCells = useMemo(() => {
    const first = mondayOf(monthStart);
    const cells: Date[] = [];
    for (let index = 0; index < 42; index += 1) cells.push(new Date(first.getTime() + index * DAY_MS));
    while (cells.length > 7 && cells[cells.length - 7].getMonth() !== anchor.getMonth()) cells.splice(-7, 7);
    return cells;
  }, [anchor, monthStart]);
  const todayKey = dateKey(new Date());
  const dayEvents = byDay.get(selectedDay) || [];
  const selectedLabel = new Date(`${selectedDay}T00:00:00`).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" });
  const dayKindCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const event of dayEvents) counts.set(event.kind, (counts.get(event.kind) || 0) + 1);
    return [...counts.entries()].map(([key, count]) => `${KIND_KO[key] || key} ${count}`).join(" · ");
  }, [dayEvents]);

  function move(step: number) {
    const unit = view === "week" ? 7 * DAY_MS : 0;
    if (view === "week") setAnchor((prev) => new Date(prev.getTime() + step * unit));
    else setAnchor((prev) => new Date(prev.getFullYear(), prev.getMonth() + step, 1));
  }

  async function refresh() {
    setBusy(true); setNotice(""); setError("");
    try {
      const result = await postJson<{ stored?: number; providers?: Record<string, number | string> }>("/api/market-calendar/refresh", {});
      const fred = result.providers?.fred_macro;
      setNotice(`일정 ${result.stored ?? 0}건 수집${fred === "fred_key_required" ? " · 미국 지표 일정은 설정에서 FRED API Key를 등록하면 함께 수집됩니다" : ""}`);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "일정 수집에 실패했습니다.");
    } finally { setBusy(false); }
  }

  return (
    <section className="cockpit-panel cockpit-calendar" aria-labelledby="market-calendar-title">
      <div className="cockpit-panel__head">
        <div><span>MARKET CALENDAR</span><h2 id="market-calendar-title">주요 실적·지표 일정</h2></div>
        <div className="cockpit-panel__actions">
          <div className="cockpit-chart-controls"><div role="group" aria-label="캘린더 보기">
            <button type="button" aria-pressed={view === "week"} onClick={() => { setView("week"); persist({ calendarView: "week" }); }}>주간</button>
            <button type="button" aria-pressed={view === "month"} onClick={() => { setView("month"); persist({ calendarView: "month" }); }}>월간</button>
          </div></div>
          <button className="filter-btn" type="button" aria-label={view === "week" ? "이전 주" : "이전 달"} onClick={() => move(-1)}>◀</button>
          <button className="filter-btn" type="button" onClick={() => { const now = new Date(); setAnchor(now); setSelectedDay(dateKey(now)); }}>오늘</button>
          <button className="filter-btn" type="button" aria-label={view === "week" ? "다음 주" : "다음 달"} onClick={() => move(1)}>▶</button>
          <button className="filter-btn apply" type="button" onClick={refresh} disabled={busy}>{busy ? "수집 중" : "일정 수집"}</button>
        </div>
      </div>
      <div className="cal-filter-row" role="group" aria-label="일정 필터">
        {KIND_FILTERS.map((row) => (
          <button key={row.value} type="button" className="cal-filter" aria-pressed={kind === row.value}
            onClick={() => { setKind(row.value); persist({ calendarKind: row.value }); }}>{row.label}</button>
        ))}
        <span className="cal-filter-sep" aria-hidden="true" />
        {["all", "US", "KR"].map((value) => (
          <button key={value} type="button" className="cal-filter" aria-pressed={market === value}
            onClick={() => { setMarket(value); persist({ calendarMarket: value }); }}>{value === "all" ? "전체 시장" : value}</button>
        ))}
        <label className="cal-watch-toggle"><input type="checkbox" checked={watchOnly}
          onChange={(event) => { setWatchOnly(event.currentTarget.checked); persist({ calendarWatchlistOnly: event.currentTarget.checked }); }} /> 보유·관심만</label>
      </div>
      {notice && <p className="react-reader-status">{notice}</p>}
      {error && <p className="react-dashboard-error" role="alert">{error}</p>}

      {view === "week" ? (
        <div className="cal-week-strip" role="tablist" aria-label="이번 주">
          {weekDays.map((day, index) => {
            const key = dateKey(day);
            const rows = byDay.get(key) || [];
            const kinds = [...new Set(rows.map((row) => row.kind))].slice(0, 3);
            return (
              <button key={key} type="button" role="tab" aria-selected={key === selectedDay}
                className={`cal-day${key === selectedDay ? " cal-day--active" : ""}${index >= 5 ? " cal-day--dim" : ""}${key === todayKey ? " cal-day--today" : ""}`}
                onClick={() => setSelectedDay(key)}>
                <span>{DOW_KO[index]}{key === todayKey ? " · 오늘" : ""}</span>
                <b>{day.getMonth() + 1}.{day.getDate()}</b>
                <small>{rows.length ? `${rows.length}건` : "—"}</small>
                <i>{kinds.map((value) => <u key={value} data-kind={value} />)}</i>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="cal-month-grid" aria-label={`${anchor.getFullYear()}년 ${anchor.getMonth() + 1}월`}>
          {DOW_KO.map((label, index) => <span key={label} className={`cal-dow${index >= 5 ? " cal-dow--dim" : ""}`}>{label}</span>)}
          {monthCells.map((day) => {
            const key = dateKey(day);
            const rows = byDay.get(key) || [];
            const outside = day.getMonth() !== anchor.getMonth();
            return (
              <button key={key} type="button"
                className={`cal-cell${key === todayKey ? " cal-cell--today" : ""}${outside ? " cal-cell--dim" : ""}${key === selectedDay ? " cal-cell--active" : ""}`}
                onClick={() => setSelectedDay(key)}>
                <header>{day.getDate()}{rows.length ? <b>{rows.length}건</b> : null}{key === todayKey ? <i>오늘</i> : null}</header>
                {rows.slice(0, 3).map((event) => <span key={event.id} className="ev" data-kind={event.kind}>{shortChip(event)}</span>)}
                {rows.length > 3 ? <em>+{rows.length - 3}건</em> : null}
              </button>
            );
          })}
        </div>
      )}

      <p className="cal-day-head"><b>{selectedLabel}</b>{dayEvents.length ? <> · {dayEvents.length}건 — {dayKindCounts}</> : null}</p>
      {dayEvents.length ? (
        <div className="table-scroll"><table className="cal-table">
          <thead><tr><th scope="col">시간(KST)</th><th scope="col">시장</th><th scope="col">중요도</th><th scope="col">이벤트</th><th scope="col">확정도</th></tr></thead>
          <tbody>
            {dayEvents.map((event) => (
              <tr key={event.id}>
                <td>{timeLabelKST(event)}</td>
                <td><span className="mkt-chip">{event.market || "—"}</span></td>
                <td><span className="imp" aria-label={`중요도 ${event.importance || 1}/3`}>{[1, 2, 3].map((level) => <u key={level} className={(event.importance || 1) >= level ? "on" : ""} />)}</span></td>
                <td>
                  {event.sourceUrl ? <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer"><strong>{event.title}</strong></a> : <strong>{event.title}</strong>}
                  <small>{KIND_KO[event.kind] || event.kind}{event.source ? ` · ${event.source}` : ""}</small>
                </td>
                <td><span className={`certainty-badge certainty-badge--${event.status}`}>{STATUS_KO[event.status] || event.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      ) : (
        <p className="cockpit-empty">
          {events.length ? "이 날짜에는 표시할 일정이 없습니다." : "저장된 시장 일정이 없습니다. 위의 일정 수집을 실행하면 휴장일·FOMC·보유/관심 종목 실적이 채워집니다."}
        </p>
      )}
    </section>
  );
}
