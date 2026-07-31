import type { PixelOfficeSceneManifest, RouteNodeId, ScenePoint } from "./sceneTypes";

export type AuthoredRoute = Readonly<{
  nodes: readonly RouteNodeId[];
  points: readonly ScenePoint[];
}>;

function buildAdjacency(manifest: PixelOfficeSceneManifest) {
  const adjacency = new Map<RouteNodeId, RouteNodeId[]>();
  for (const node of Object.keys(manifest.routeNodes) as RouteNodeId[]) adjacency.set(node, []);
  for (const [from, to] of manifest.routeEdges) {
    adjacency.get(from)?.push(to);
    adjacency.get(to)?.push(from);
  }
  return adjacency;
}

export function findAuthoredRoute(
  manifest: PixelOfficeSceneManifest,
  start: RouteNodeId,
  target: RouteNodeId,
): AuthoredRoute {
  if (!manifest.routeNodes[start] || !manifest.routeNodes[target]) {
    throw new Error(`Unknown route node: ${start} -> ${target}`);
  }
  if (start === target) {
    return { nodes: [start], points: [manifest.routeNodes[start]] };
  }

  const adjacency = buildAdjacency(manifest);
  const queue: RouteNodeId[] = [start];
  const previous = new Map<RouteNodeId, RouteNodeId | null>([[start, null]]);
  while (queue.length) {
    const current = queue.shift()!;
    for (const next of adjacency.get(current) || []) {
      if (previous.has(next)) continue;
      previous.set(next, current);
      if (next === target) {
        queue.length = 0;
        break;
      }
      queue.push(next);
    }
  }
  if (!previous.has(target)) throw new Error(`No authored route: ${start} -> ${target}`);

  const nodes: RouteNodeId[] = [];
  let cursor: RouteNodeId | null = target;
  while (cursor) {
    nodes.unshift(cursor);
    cursor = previous.get(cursor) ?? null;
  }
  return {
    nodes,
    points: nodes.map((node) => manifest.routeNodes[node]),
  };
}

export function assertStronglyConnected(manifest: PixelOfficeSceneManifest) {
  const nodeIds = Object.keys(manifest.routeNodes) as RouteNodeId[];
  for (const start of nodeIds) {
    for (const target of nodeIds) findAuthoredRoute(manifest, start, target);
  }
  return true;
}

