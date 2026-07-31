import type { OfficeObjectDefinition, OfficeObjectSummary } from "./types";

const STATE_LABELS: Record<OfficeObjectSummary["state"], string> = {
  loading: "불러오는 중",
  ready: "준비됨",
  busy: "작업 중",
  attention: "확인 필요",
  empty: "비어 있음",
  stale: "업데이트 필요",
  unavailable: "사용 불가",
  error: "오류",
};

export function OfficeObject({
  definition,
  status,
  selected,
  onSelect,
}: {
  definition: OfficeObjectDefinition;
  status: OfficeObjectSummary;
  selected: boolean;
  onSelect: () => void;
}) {
  const stateLabel = STATE_LABELS[status.state];
  return (
    <button
      type="button"
      className={`office-object office-object-${definition.zone}${selected ? " is-selected" : ""}`}
      data-object-id={definition.id}
      data-state={status.state}
      aria-pressed={selected}
      aria-label={`${definition.label}: ${stateLabel}. ${status.summary}`}
      onClick={onSelect}
    >
      <span className="office-object-instrument" aria-hidden="true">
        <span>{definition.symbol}</span>
      </span>
      <span className="office-object-copy">
        <small>{definition.shortLabel}</small>
        <strong>{definition.label}</strong>
        <span className="office-object-status">
          <i aria-hidden="true" />
          {stateLabel}
        </span>
      </span>
    </button>
  );
}

