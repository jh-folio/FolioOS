import { useEffect, useMemo, useState } from "react";
import type { MotionPreference } from "../homePreference";
import { resolveAgentActivity } from "./activityState";
import type { OfficeJob } from "./types";

export function useAgentActivity(
  jobs: OfficeJob[],
  attentionCount: number,
  motion: MotionPreference,
) {
  const [ambientIndex, setAmbientIndex] = useState(0);

  useEffect(() => {
    if (motion === "reduced" || document.visibilityState === "hidden") return undefined;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "hidden") {
        setAmbientIndex((current) => current + 1);
      }
    }, 12000);
    return () => window.clearInterval(timer);
  }, [motion]);

  return useMemo(
    () => resolveAgentActivity(jobs, attentionCount, ambientIndex),
    [ambientIndex, attentionCount, jobs],
  );
}

