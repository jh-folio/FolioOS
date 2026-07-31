import { OFFICE_OBJECTS } from "./officeObjects";
import type { OfficeObjectId, OfficeObjectSummary } from "./types";

export function MobileOfficeCards({
  objects,
  onSelect,
}: {
  objects: OfficeObjectSummary[];
  onSelect: (id: OfficeObjectId) => void;
}) {
  const byId = new Map(objects.map((item) => [item.id, item]));
  return (
    <section className="mobile-office-cards" aria-label="Office 상태 목록">
      {OFFICE_OBJECTS.map((definition) => {
        const status = byId.get(definition.id)!;
        return (
          <button type="button" key={definition.id} data-state={status.state} onClick={() => onSelect(definition.id)}>
            <span className="mobile-office-card-symbol" aria-hidden="true">{definition.symbol}</span>
            <span>
              <small>{definition.shortLabel}</small>
              <strong>{definition.label}</strong>
              <span>{status.summary}</span>
            </span>
            <i aria-hidden="true">›</i>
          </button>
        );
      })}
    </section>
  );
}

