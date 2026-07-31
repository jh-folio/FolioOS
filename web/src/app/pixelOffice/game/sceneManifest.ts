import {
  OFFICE_OBJECT_IDS,
  type PixelOfficeSceneManifest,
  type RouteNodeId,
  type ScenePoint,
  type SceneRect,
} from "./sceneTypes";

export class SceneManifestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SceneManifestError";
  }
}

function isFinitePoint(point: ScenePoint) {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

function isPositiveRect(rect: SceneRect) {
  return isFinitePoint(rect) && rect.width > 0 && rect.height > 0;
}

function pointInside(point: ScenePoint, width: number, height: number) {
  return point.x >= 0 && point.x <= width && point.y >= 0 && point.y <= height;
}

function rectInside(rect: SceneRect, width: number, height: number) {
  return rect.x >= 0
    && rect.y >= 0
    && rect.x + rect.width <= width
    && rect.y + rect.height <= height;
}

function orientation(a: ScenePoint, b: ScenePoint, c: ScenePoint) {
  return (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
}

function onSegment(a: ScenePoint, b: ScenePoint, c: ScenePoint) {
  return b.x <= Math.max(a.x, c.x)
    && b.x >= Math.min(a.x, c.x)
    && b.y <= Math.max(a.y, c.y)
    && b.y >= Math.min(a.y, c.y);
}

function segmentsIntersect(a: ScenePoint, b: ScenePoint, c: ScenePoint, d: ScenePoint) {
  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);
  if ((o1 > 0) !== (o2 > 0) && (o3 > 0) !== (o4 > 0)) return true;
  if (o1 === 0 && onSegment(a, c, b)) return true;
  if (o2 === 0 && onSegment(a, d, b)) return true;
  if (o3 === 0 && onSegment(c, a, d)) return true;
  if (o4 === 0 && onSegment(c, b, d)) return true;
  return false;
}

function segmentIntersectsRect(start: ScenePoint, end: ScenePoint, rect: SceneRect) {
  const inside = (point: ScenePoint) => (
    point.x >= rect.x
    && point.x <= rect.x + rect.width
    && point.y >= rect.y
    && point.y <= rect.y + rect.height
  );
  if (inside(start) || inside(end)) return true;
  const topLeft = { x: rect.x, y: rect.y };
  const topRight = { x: rect.x + rect.width, y: rect.y };
  const bottomRight = { x: rect.x + rect.width, y: rect.y + rect.height };
  const bottomLeft = { x: rect.x, y: rect.y + rect.height };
  return segmentsIntersect(start, end, topLeft, topRight)
    || segmentsIntersect(start, end, topRight, bottomRight)
    || segmentsIntersect(start, end, bottomRight, bottomLeft)
    || segmentsIntersect(start, end, bottomLeft, topLeft);
}

export function validateSceneManifest(manifest: PixelOfficeSceneManifest) {
  const issues: string[] = [];
  const { width, height } = manifest.logicalSize;
  if (manifest.version !== 1) issues.push("version must be 1");
  if (manifest.sceneId !== "classic_analyst") issues.push("sceneId must be classic_analyst");
  if (width !== 560 || height !== 315) issues.push("logicalSize must remain 560x315");
  if (manifest.tileSize !== 16) issues.push("tileSize must remain 16");

  const anchorIds = manifest.anchors.map((anchor) => anchor.id);
  for (const id of OFFICE_OBJECT_IDS) {
    const count = anchorIds.filter((candidate) => candidate === id).length;
    if (count !== 1) issues.push(`anchor ${id} must occur exactly once`);
  }
  if (anchorIds.length !== OFFICE_OBJECT_IDS.length) {
    issues.push("manifest must contain only the seven semantic anchors");
  }

  for (const anchor of manifest.anchors) {
    if (!pointInside(anchor.position, width, height)) issues.push(`anchor ${anchor.id} position is outside the scene`);
    if (!isPositiveRect(anchor.hitArea) || !rectInside(anchor.hitArea, width, height)) {
      issues.push(`anchor ${anchor.id} hitArea is invalid`);
    }
    if (!isPositiveRect(anchor.collisionBounds) || !rectInside(anchor.collisionBounds, width, height)) {
      issues.push(`anchor ${anchor.id} collisionBounds is invalid`);
    }
    if (!isPositiveRect(anchor.occlusionBounds) || !rectInside(anchor.occlusionBounds, width, height)) {
      issues.push(`anchor ${anchor.id} occlusionBounds is invalid`);
    }
    const node = manifest.routeNodes[anchor.id];
    if (!node || node.x !== anchor.position.x || node.y !== anchor.position.y) {
      issues.push(`anchor ${anchor.id} must match its route node`);
    }
  }

  const routeNodeIds = new Set(Object.keys(manifest.routeNodes) as RouteNodeId[]);
  const edgeKeys = new Set<string>();
  if (!routeNodeIds.has(manifest.spawnNode)) issues.push("spawnNode must exist in routeNodes");
  for (const [from, to] of manifest.routeEdges) {
    if (from === to) issues.push(`route edge ${from} cannot loop to itself`);
    if (!routeNodeIds.has(from) || !routeNodeIds.has(to)) issues.push(`route edge ${from}-${to} references a missing node`);
    const edgeKey = [from, to].sort().join("::");
    if (edgeKeys.has(edgeKey)) issues.push(`route edge ${from}-${to} is duplicated`);
    edgeKeys.add(edgeKey);
    const start = manifest.routeNodes[from];
    const end = manifest.routeNodes[to];
    if (start && end) {
      for (const anchor of manifest.anchors) {
        if (segmentIntersectsRect(start, end, anchor.collisionBounds)) {
          issues.push(`route edge ${from}-${to} intersects ${anchor.id} collisionBounds`);
        }
      }
    }
  }
  for (const [id, point] of Object.entries(manifest.routeNodes)) {
    if (!isFinitePoint(point) || !pointInside(point, width, height)) issues.push(`route node ${id} is outside the scene`);
  }

  if (issues.length) throw new SceneManifestError(issues.join("; "));
  return manifest;
}
