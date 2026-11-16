import { buildingDefs } from "./content";
export interface BuildingShape {
  id?: string;
  kind?: string;
  type: string;
  x: number;
  z: number;
  rotation?: number;
  faction?: string;
  hp?: number;
  joined?: boolean;
}
/** Dimensions of the actual walls, rather than the roof overhang. */
export function footprint(type: string, rotation = 0) {
  const family = buildingDefs[type]?.behavior || type;
  let width = 1.8,
    depth = 1.6;
  if (["hall", "castle"].includes(family)) {
    width = 2.6;
    depth = 2.2;
  } else if (family === "warehouse") width = 2.3;
  else if (["road", "bridge", "trench", "canal", "waterGate"].includes(family))
    width = depth = 1;
  else if (family === "wall") {
    width =
      buildingDefs[type]?.material === "wood" || type === "stoneRampart"
        ? 0.84
        : 0.45;
    depth = 1;
  } else if (family === "gate") {
    width = 0.65;
    depth = 2.65;
  } else if (family === "tower")
    width = depth =
      type === "bastion" ? 1.7 : type === "ballistaTower" ? 1.2 : 1;
  else if (family === "field") width = depth = 1.5;
  else if (family === "livestock" || type === "camelYard") width = depth = 2.5;
  else if (
    [
      "well",
      "lantern",
      "torch",
      "campfire",
      "bench",
      "banner",
      "signpost",
    ].includes(family)
  )
    width = depth = 1;
  return rotation % 2 ? { width: depth, depth: width } : { width, depth };
}
export function overlaps(a: BuildingShape, b: BuildingShape, margin = 0) {
  const aa = footprint(a.type, a.rotation),
    bb = footprint(b.type, b.rotation);
  return (
    Math.abs(a.x - b.x) < (aa.width + bb.width) / 2 + margin - 0.001 &&
    Math.abs(a.z - b.z) < (aa.depth + bb.depth) / 2 + margin - 0.001
  );
}
export function covers(b: BuildingShape, x: number, z: number) {
  const f = footprint(b.type, b.rotation);
  return (
    Math.abs(b.x - x) < f.width / 2 + 0.15 &&
    Math.abs(b.z - z) < f.depth / 2 + 0.15
  );
}
export function touching(a: BuildingShape, b: BuildingShape) {
  const aa = footprint(a.type, a.rotation),
    bb = footprint(b.type, b.rotation);
  return (
    (Math.abs(Math.abs(a.x - b.x) - (aa.width + bb.width) / 2) < 0.015 &&
      Math.abs(a.z - b.z) < (aa.depth + bb.depth) / 2 - 0.2) ||
    (Math.abs(Math.abs(a.z - b.z) - (aa.depth + bb.depth) / 2) < 0.015 &&
      Math.abs(a.x - b.x) < (aa.width + bb.width) / 2 - 0.2)
  );
}
export function attachmentPoints(
  type: string,
  rotation: number,
  target: BuildingShape,
) {
  const a = footprint(type, rotation),
    b = footprint(target.type, target.rotation);
  return [
    { x: target.x + (a.width + b.width) / 2, z: target.z },
    { x: target.x - (a.width + b.width) / 2, z: target.z },
    { x: target.x, z: target.z + (a.depth + b.depth) / 2 },
    { x: target.x, z: target.z - (a.depth + b.depth) / 2 },
  ].map((p) => ({
    ...p,
    x: Math.round(p.x * 1000) / 1000,
    z: Math.round(p.z * 1000) / 1000,
    attachTo: target.id!,
  }));
}
export function snapCandidates(
  entities: BuildingShape[],
  type: string,
  rotation: number,
  x: number,
  z: number,
) {
  return entities
    .filter(
      (e) => e.kind === "building" && e.faction === "player" && (e.hp ?? 0) > 0,
    )
    .flatMap((e) => attachmentPoints(type, rotation, e))
    .filter((p) => Math.hypot(p.x - x, p.z - z) <= 1.25)
    .sort(
      (a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z),
    );
}

/** Follow physical joints, including continuous decks, without swallowing nearby buildings. */
export function connectedConstruction<
  T extends BuildingShape & { id: string; links?: string[] },
>(entities: T[], target: T): T[] {
  const available = entities.filter(
    (e) =>
      e.kind === "building" && e.faction === target.faction && (e.hp ?? 0) > 0,
  );
  const result = [target],
    seen = new Set([target.id]);
  for (let i = 0; i < result.length; i++) {
    const current = result[i];
    for (const next of available) {
      if (seen.has(next.id)) continue;
      const bridge =
        (buildingDefs[current.type]?.behavior || current.type) === "bridge" &&
        next.type === current.type &&
        (next.rotation ?? 0) === (current.rotation ?? 0) &&
        ((current.rotation ?? 0) % 2
          ? Math.abs(current.x - next.x) < 0.001 &&
            Math.abs(Math.abs(current.z - next.z) - 1) < 0.001
          : Math.abs(current.z - next.z) < 0.001 &&
            Math.abs(Math.abs(current.x - next.x) - 1) < 0.001);
      if (
        bridge ||
        ((current.links?.includes(next.id) ||
          next.links?.includes(current.id)) &&
          touching(current, next))
      ) {
        seen.add(next.id);
        result.push(next);
      }
    }
  }
  return result;
}
export function transformConstruction<T extends BuildingShape & { id: string }>(
  members: T[],
  anchor: T,
  x: number,
  z: number,
  turns: number,
): T[] {
  const r = ((Math.round(turns) % 4) + 4) % 4;
  return members.map((e) => {
    const dx = e.x - anchor.x,
      dz = e.z - anchor.z;
    const offset =
      r === 0
        ? [dx, dz]
        : r === 1
          ? [dz, -dx]
          : r === 2
            ? [-dx, -dz]
            : [-dz, dx];
    return {
      ...e,
      x: Math.round((x + offset[0]) * 1000) / 1000,
      z: Math.round((z + offset[1]) * 1000) / 1000,
      rotation: ((e.rotation ?? 0) + r) % 4,
    };
  });
}
