import { useEffect, useState } from "react";
import type { AgentCharacterPreset, MotionPreference } from "../homePreference";
import type { AgentActivity } from "./activityState";
import { characterPresetById } from "./characterPresets";

export function AgentCharacter({
  presetId,
  name,
  activity,
  motion,
}: {
  presetId: AgentCharacterPreset;
  name: string;
  activity: AgentActivity;
  motion: MotionPreference;
}) {
  const preset = characterPresetById(presetId);
  const [assetFailed, setAssetFailed] = useState(false);

  useEffect(() => setAssetFailed(false), [preset.asset]);

  if (assetFailed) {
    return (
      <div className="agent-character-fallback" data-preset={preset.id} role="img" aria-label={`${name || preset.label}: ${activity.label}`}>
        <span />
        <strong>{name || preset.label}</strong>
      </div>
    );
  }

  const frame = motion === "reduced" && activity.kind === "ambient" ? 0 : activity.frame;
  const column = frame % 4;
  const row = Math.floor(frame / 4);
  const singleFrame = preset.layout === "single";
  return (
    <div className="agent-character" role="img" aria-label={`${name || preset.alt}: ${activity.label}`}>
      <img src={preset.asset} alt="" onError={() => setAssetFailed(true)} aria-hidden="true" />
      <span
        className={`agent-character-sprite${singleFrame ? " is-single-frame" : ""}`}
        style={{
          backgroundImage: `url("${preset.asset}")`,
          backgroundPosition: singleFrame ? "center bottom" : `${column * 33.3333}% ${row * 100}%`,
          backgroundSize: singleFrame ? "contain" : "400% 200%",
        }}
        data-frame={frame}
        data-activity={activity.kind}
        aria-hidden="true"
      />
      <strong>{name || preset.label}</strong>
      <small>{activity.label}</small>
    </div>
  );
}
