import { OFFICE_OBJECTS } from "../officeObjects";
import type { OfficeObjectId, OfficeObjectSummary } from "../types";
import type { PixelOfficeSceneManifest } from "./sceneTypes";

export function PixelOfficeSemanticOverlay({
  manifest,
  objects,
  selectedId,
  onSelect,
}: {
  manifest: PixelOfficeSceneManifest;
  objects: OfficeObjectSummary[];
  selectedId: OfficeObjectId | null;
  onSelect: (id: OfficeObjectId) => void;
}) {
  const statusById = new Map(objects.map((item) => [item.id, item]));
  const definitionById = new Map(OFFICE_OBJECTS.map((item) => [item.id, item]));
  return (
    <div className="pixel-office-semantic-layer" aria-label="Pixel Office 업무 공간">
      {manifest.anchors.map((anchor) => {
        const status = statusById.get(anchor.id);
        const definition = definitionById.get(anchor.id);
        if (!status || !definition) return null;
        return (
          <button
            key={anchor.id}
            type="button"
            className={`pixel-office-hotspot state-${status.state}${selectedId === anchor.id ? " is-selected" : ""}`}
            style={{
              left: `${(anchor.hitArea.x / manifest.logicalSize.width) * 100}%`,
              top: `${(anchor.hitArea.y / manifest.logicalSize.height) * 100}%`,
              width: `${(anchor.hitArea.width / manifest.logicalSize.width) * 100}%`,
              height: `${(anchor.hitArea.height / manifest.logicalSize.height) * 100}%`,
            }}
            aria-label={`${definition.label}: ${status.summary}`}
            aria-pressed={selectedId === anchor.id}
            data-office-object={anchor.id}
            data-label-placement={anchor.labelPlacement}
            onClick={() => onSelect(anchor.id)}
          >
            <span className="pixel-office-hotspot-dot" aria-hidden="true" />
            <span className="pixel-office-hotspot-label" aria-hidden="true">
              {definition.shortLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}

