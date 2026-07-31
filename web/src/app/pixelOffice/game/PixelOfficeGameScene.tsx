import { useCallback, useMemo, useState } from "react";
import type { AgentActivity } from "../activityState";
import { PixelOfficeScene } from "../PixelOfficeScene";
import type { OfficeObjectId, OfficeObjectSummary } from "../types";
import { activityToIntent } from "./activityIntent";
import { CLASSIC_SCENE_MANIFEST } from "./classicScene";
import type { MovementPhase } from "./movementMachine";
import { PixelOfficeCanvas } from "./PixelOfficeCanvas";
import { PixelOfficeSemanticOverlay } from "./PixelOfficeSemanticOverlay";
import type { SceneObjectStatus } from "./sceneTypes";

const PHASE_LABELS: Record<MovementPhase, string> = {
  idle: "대기 중",
  route_pending: "이동 경로 확인 중",
  walking: "업무 위치로 이동 중",
  arriving: "업무 위치에 도착",
  working: "작업 중",
  waiting: "작업 준비 중",
  complete: "작업 완료",
  error: "확인 필요",
};

export function PixelOfficeGameScene({
  objects,
  selectedId,
  onSelect,
  activity,
  reducedMotion,
  fallbackCharacter,
}: {
  objects: OfficeObjectSummary[];
  selectedId: OfficeObjectId | null;
  onSelect: (id: OfficeObjectId) => void;
  activity: AgentActivity;
  reducedMotion: boolean;
  fallbackCharacter: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [failure, setFailure] = useState("");
  const [phase, setPhase] = useState<MovementPhase>("idle");
  const intent = useMemo(() => activityToIntent(activity), [activity]);
  const statuses = useMemo(() => {
    const result = {} as Record<OfficeObjectId, OfficeObjectSummary["state"]>;
    for (const item of objects) result[item.id] = item.state;
    return result as SceneObjectStatus;
  }, [objects]);
  const handleFailure = useCallback((message: string) => setFailure(message), []);

  if (failure) {
    return (
      <div className="pixel-office-renderer-fallback" data-renderer="css" data-renderer-error={failure}>
        <PixelOfficeScene
          objects={objects}
          selectedId={selectedId}
          onSelect={onSelect}
          character={fallbackCharacter}
          characterAnchor={activity.anchor}
        />
        <p className="pixel-office-fallback-note" role="status">
          호환 모드로 장면을 표시하고 있습니다.
        </p>
      </div>
    );
  }

  return (
    <section
      className="pixel-office-game-frame"
      aria-label="Pixel Office 업무 공간"
      data-renderer="pixi"
      data-ready={ready ? "true" : "false"}
    >
      <div className="pixel-office-game-viewport">
        <PixelOfficeCanvas
          manifest={CLASSIC_SCENE_MANIFEST}
          statuses={statuses}
          intent={intent}
          reducedMotion={reducedMotion}
          onReady={() => setReady(true)}
          onFailure={handleFailure}
          onPhaseChange={setPhase}
        />
        <PixelOfficeSemanticOverlay
          manifest={CLASSIC_SCENE_MANIFEST}
          objects={objects}
          selectedId={selectedId}
          onSelect={onSelect}
        />
        {!ready && <div className="pixel-office-canvas-loading">오피스 불러오는 중</div>}
        <div className="pixel-office-agent-caption" aria-live="polite">
          <span>{PHASE_LABELS[phase]}</span>
          <strong>{activity.label}</strong>
        </div>
      </div>
    </section>
  );
}

