import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { HomeModeSwitch } from "./HomeModeSwitch";
import { useUiPreferences } from "./homePreference";
import { useAgentWorkspace } from "./agentWorkspace/useAgentWorkspace";
import { MobileAgentScene } from "./pixelOffice/MobileAgentScene";
import { MobileOfficeCards } from "./pixelOffice/MobileOfficeCards";
import { AgentAttentionBar } from "./pixelOffice/AgentAttentionBar";
import { AgentCharacter } from "./pixelOffice/AgentCharacter";
import { OfficeDetailPanel } from "./pixelOffice/OfficeDetailPanel";
import { PixelOfficeScene } from "./pixelOffice/PixelOfficeScene";
import { PixelOfficeSceneBoundary } from "./pixelOffice/game/PixelOfficeSceneBoundary";
import type { OfficeObjectId } from "./pixelOffice/types";
import { useAgentActivity } from "./pixelOffice/useAgentActivity";
import { useAgentAttention } from "./pixelOffice/useAgentAttention";
import { usePixelOffice } from "./pixelOffice/usePixelOffice";

const PixelOfficeGameScene = lazy(() => import("./pixelOffice/game/PixelOfficeGameScene").then((module) => ({
  default: module.PixelOfficeGameScene,
})));

export function PixelOfficeRoute() {
  const office = usePixelOffice();
  const workspace = useAgentWorkspace("pixel_office");
  const uiPreferences = useUiPreferences();
  const [selectedId, setSelectedId] = useState<OfficeObjectId | null>(null);
  const [systemReducedMotion, setSystemReducedMotion] = useState(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
  );
  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!media) return undefined;
    const update = () => setSystemReducedMotion(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const effectiveMotion = uiPreferences.preferences.motion === "reduced" || systemReducedMotion
    ? "reduced"
    : "system";
  const attention = useAgentAttention(office.jobs, workspace.messages);
  const blockingAttentionCount = attention.items.some((item) => item.tone !== "success") ? 1 : 0;
  const activity = useAgentActivity(office.jobs, blockingAttentionCount, effectiveMotion);
  const closePanel = useCallback(() => setSelectedId(null), []);
  const selectedStatus = office.objects.find((item) => item.id === selectedId) || null;
  const characterName = uiPreferences.preferences.character.name
    || (uiPreferences.preferences.character.preset === "student" ? "경제 탐구생" : "클래식 애널리스트");
  const character = (
    <AgentCharacter
      presetId={uiPreferences.preferences.character.preset}
      name={characterName}
      activity={activity}
      motion={effectiveMotion}
    />
  );
  const legacyScene = (
    <PixelOfficeScene
      objects={office.objects}
      selectedId={selectedId}
      onSelect={setSelectedId}
      character={character}
      characterAnchor={activity.anchor}
    />
  );

  return (
    <div
      className={`pixel-office-route${selectedId ? " has-panel" : ""}`}
      data-pixel-office-route
      data-motion={effectiveMotion}
    >
      <header className="pixel-office-intro">
        <div>
          <p className="section-kicker">Pixel Office</p>
          <h1>리서치 오피스</h1>
          <p>자료의 freshness와 Agent 작업을 한 장면에서 확인합니다.</p>
        </div>
        <div className="pixel-office-intro-actions">
          <button type="button" onClick={() => office.refresh()} disabled={office.loading}>
            {office.loading ? "확인 중" : "상태 새로고침"}
          </button>
          <HomeModeSwitch current="office" />
        </div>
      </header>

      {office.error && (
        <div className="pixel-office-error" role="status">
          <span>{office.error}</span>
          <button type="button" onClick={() => office.refresh()}>다시 시도</button>
        </div>
      )}

      <AgentAttentionBar
        items={attention.items}
        onAcknowledge={attention.acknowledge}
        onAcknowledgeAll={attention.acknowledgeAll}
        onOpenAgent={() => setSelectedId("agent_seat")}
      />

      <div className="pixel-office-workspace">
        <div className="pixel-office-primary">
          <MobileAgentScene character={character} status={activity.label} />
          <PixelOfficeSceneBoundary fallback={legacyScene}>
            <Suspense fallback={legacyScene}>
              <PixelOfficeGameScene
                objects={office.objects}
                selectedId={selectedId}
                onSelect={setSelectedId}
                activity={activity}
                reducedMotion={effectiveMotion === "reduced"}
                fallbackCharacter={character}
              />
            </Suspense>
          </PixelOfficeSceneBoundary>
          <MobileOfficeCards objects={office.objects} onSelect={setSelectedId} />
        </div>
        <OfficeDetailPanel
          selectedId={selectedId}
          status={selectedStatus}
          workspace={workspace}
          onClose={closePanel}
        />
      </div>
    </div>
  );
}
