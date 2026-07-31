import { OFFICE_OBJECTS } from "./officeObjects";
import { OfficeObject } from "./OfficeObject";
import type { OfficeObjectId, OfficeObjectSummary } from "./types";

export function PixelOfficeScene({
  objects,
  selectedId,
  onSelect,
  character,
  characterAnchor = "agent_seat",
}: {
  objects: OfficeObjectSummary[];
  selectedId: OfficeObjectId | null;
  onSelect: (id: OfficeObjectId) => void;
  character?: React.ReactNode;
  characterAnchor?: OfficeObjectId;
}) {
  const byId = new Map(objects.map((item) => [item.id, item]));
  return (
    <section className="pixel-office-scene" aria-label="Pixel Office 업무 공간">
      <div className="office-window" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="office-rug" aria-hidden="true" />
      <div className="office-character-stage" data-anchor={characterAnchor} aria-label="현재 Agent 상태">
        {character}
      </div>
      {OFFICE_OBJECTS.map((definition) => (
        <OfficeObject
          key={definition.id}
          definition={definition}
          status={byId.get(definition.id)!}
          selected={selectedId === definition.id}
          onSelect={() => onSelect(definition.id)}
        />
      ))}
    </section>
  );
}
