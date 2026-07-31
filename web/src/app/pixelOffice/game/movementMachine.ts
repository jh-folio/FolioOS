import { findAuthoredRoute } from "./routeGraph";
import type { PixelOfficeSceneManifest, RouteNodeId, ScenePoint } from "./sceneTypes";

export type MovementPhase =
  | "idle"
  | "route_pending"
  | "walking"
  | "arriving"
  | "working"
  | "waiting"
  | "complete"
  | "error";

export type ArrivalPhase = Exclude<MovementPhase, "route_pending" | "walking" | "arriving">;
export type MovementFacing = "north" | "south" | "east" | "west";

export type MovementState = Readonly<{
  phase: MovementPhase;
  position: ScenePoint;
  facing: MovementFacing;
  currentNode: RouteNodeId;
  targetNode: RouteNodeId;
  requestedNode: RouteNodeId | null;
  arrivalPhase: ArrivalPhase;
  route: readonly ScenePoint[];
  routeNodes: readonly RouteNodeId[];
  segmentIndex: number;
}>;

export function createMovementState(
  manifest: PixelOfficeSceneManifest,
  node: RouteNodeId = manifest.spawnNode,
): MovementState {
  return {
    phase: "idle",
    position: manifest.routeNodes[node],
    facing: "south",
    currentNode: node,
    targetNode: node,
    requestedNode: null,
    arrivalPhase: "idle",
    route: [manifest.routeNodes[node]],
    routeNodes: [node],
    segmentIndex: 0,
  };
}

export function requestMovement(
  state: MovementState,
  targetNode: RouteNodeId,
  arrivalPhase: ArrivalPhase,
): MovementState {
  if (state.phase === "walking" || state.phase === "arriving" || state.phase === "route_pending") {
    if (state.targetNode === targetNode) return { ...state, arrivalPhase };
    return { ...state, requestedNode: targetNode, arrivalPhase };
  }
  if (state.currentNode === targetNode) {
    return {
      ...state,
      phase: arrivalPhase,
      targetNode,
      requestedNode: null,
      arrivalPhase,
    };
  }
  return {
    ...state,
    phase: "route_pending",
    targetNode,
    requestedNode: null,
    arrivalPhase,
  };
}

function facingFromDelta(dx: number, dy: number, fallback: MovementFacing): MovementFacing {
  if (Math.abs(dx) > Math.abs(dy)) return dx >= 0 ? "east" : "west";
  if (Math.abs(dy) > 0) return dy >= 0 ? "south" : "north";
  return fallback;
}

function resolvePendingRoute(state: MovementState, manifest: PixelOfficeSceneManifest): MovementState {
  const route = findAuthoredRoute(manifest, state.currentNode, state.targetNode);
  if (route.points.length < 2) return { ...state, phase: "arriving" };
  const next = route.points[1];
  return {
    ...state,
    phase: "walking",
    route: route.points,
    routeNodes: route.nodes,
    segmentIndex: 1,
    facing: facingFromDelta(next.x - state.position.x, next.y - state.position.y, state.facing),
  };
}

export function advanceMovement(
  state: MovementState,
  manifest: PixelOfficeSceneManifest,
  deltaSeconds: number,
  speed = 72,
): MovementState {
  if (state.phase === "route_pending") return resolvePendingRoute(state, manifest);
  if (state.phase === "arriving") {
    const arrived = {
      ...state,
      phase: state.arrivalPhase,
      position: manifest.routeNodes[state.targetNode],
      currentNode: state.targetNode,
      route: [manifest.routeNodes[state.targetNode]],
      routeNodes: [state.targetNode],
      segmentIndex: 0,
    };
    if (!state.requestedNode || state.requestedNode === state.targetNode) {
      return { ...arrived, requestedNode: null };
    }
    return {
      ...arrived,
      phase: "route_pending",
      targetNode: state.requestedNode,
      requestedNode: null,
    };
  }
  if (state.phase !== "walking" || deltaSeconds <= 0) return state;

  let remaining = Math.max(0, speed * deltaSeconds);
  let position = state.position;
  let segmentIndex = state.segmentIndex;
  let facing = state.facing;
  while (remaining > 0 && segmentIndex < state.route.length) {
    const target = state.route[segmentIndex];
    const dx = target.x - position.x;
    const dy = target.y - position.y;
    const distance = Math.hypot(dx, dy);
    facing = facingFromDelta(dx, dy, facing);
    if (distance <= remaining || distance < 0.001) {
      position = target;
      remaining -= distance;
      segmentIndex += 1;
      continue;
    }
    position = {
      x: position.x + (dx / distance) * remaining,
      y: position.y + (dy / distance) * remaining,
    };
    remaining = 0;
  }

  if (segmentIndex >= state.route.length) {
    return { ...state, phase: "arriving", position, segmentIndex, facing };
  }
  return { ...state, position, segmentIndex, facing };
}

