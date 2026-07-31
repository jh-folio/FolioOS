export function depthFromFootPoint(footY: number, layerOffset = 0) {
  if (!Number.isFinite(footY) || !Number.isFinite(layerOffset)) {
    throw new Error("Depth inputs must be finite");
  }
  return Math.round(footY * 100) + layerOffset;
}

