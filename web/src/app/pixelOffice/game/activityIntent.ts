import type { AgentActivity } from "../activityState";
import type { OfficeObjectId } from "../types";
import type { ArrivalPhase } from "./movementMachine";

export type ActivityIntent = Readonly<{
  destination: OfficeObjectId;
  arrivalPhase: ArrivalPhase;
  label: string;
  jobId: string;
}>;

export function activityToIntent(activity: AgentActivity): ActivityIntent {
  let arrivalPhase: ArrivalPhase = "idle";
  if (activity.kind === "error") arrivalPhase = "error";
  else if (activity.kind === "complete") arrivalPhase = "complete";
  else if (activity.working) arrivalPhase = activity.kind === "generic_work" ? "waiting" : "working";

  return {
    destination: activity.anchor,
    arrivalPhase,
    label: activity.label,
    jobId: activity.jobId,
  };
}

