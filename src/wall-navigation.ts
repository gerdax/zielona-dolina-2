import { buildingDefs } from "./content";
import { supportedPose } from "./fortification-support";
export interface WallPost {
  id: string;
  kind: string;
  type: string;
  x: number;
  z: number;
  faction: string;
  hp: number;
  rotation?: number;
  occupantId?: string;
}
export interface WallWalk {
  path: string[];
  destinationId: string;
  fromId: string;
  toId: string;
  progress: number;
  stopAfterStep?: boolean;
  descendAfterStep?: boolean;
}
const family = (p: WallPost) => buildingDefs[p.type]?.behavior || p.type;
export const isWallPost = (p: WallPost) =>
  p.kind === "building" && p.hp > 0 && ["wall", "tower"].includes(family(p));
export function postYaw(p: WallPost, entities: WallPost[]) {
  if (p.rotation !== undefined) return (p.rotation * Math.PI) / 2;
  return family(p) === "wall" &&
    entities.some(
      (e) =>
        e.kind === "building" &&
        ["wall", "gate"].includes(family(e)) &&
        Math.abs(e.z - p.z) < 0.01 &&
        Math.abs(Math.abs(e.x - p.x) - 1) < 0.01,
    )
    ? Math.PI / 2
    : 0;
}
function bounds(p: WallPost, entities: WallPost[]) {
  let width =
      family(p) === "tower"
        ? p.type === "bastion"
          ? 1.7
          : 1.4
        : buildingDefs[p.type]?.material === "wood" || p.type === "stoneRampart"
          ? 0.84
          : 0.45,
    depth = family(p) === "tower" ? (p.type === "bastion" ? 1.7 : 1.4) : 1;
  if (
    family(p) === "wall" &&
    entities.some(
      (e) =>
        ["wall", "gate"].includes(family(e)) &&
        Math.abs(e.z - p.z) < 0.01 &&
        Math.abs(Math.abs(e.x - p.x) - 1) < 0.01,
    ) &&
    entities.some(
      (e) =>
        ["wall", "gate"].includes(family(e)) &&
        Math.abs(e.x - p.x) < 0.01 &&
        Math.abs(Math.abs(e.z - p.z) - 1) < 0.01,
    )
  )
    return { width: 1, depth: 1 };
  if (Math.abs(Math.sin(postYaw(p, entities))) > 0.5)
    [width, depth] = [depth, width];
  return { width, depth };
}
export function wallConnected(a: WallPost, b: WallPost, entities: WallPost[]) {
  if (
    !isWallPost(a) ||
    !isWallPost(b) ||
    a.id === b.id ||
    a.faction !== b.faction
  )
    return false;
  const aa = bounds(a, entities),
    bb = bounds(b, entities),
    ox = (aa.width + bb.width) / 2 - Math.abs(a.x - b.x),
    oz = (aa.depth + bb.depth) / 2 - Math.abs(a.z - b.z);
  return ox >= -0.03 && oz >= -0.03 && Math.max(ox, oz) > 0.12;
}
export function wallPath(
  entities: WallPost[],
  fromId: string,
  toId: string,
): string[] | null {
  const from = entities.find((e) => e.id === fromId),
    to = entities.find((e) => e.id === toId);
  if (!from || !to || !isWallPost(from) || !isWallPost(to)) return null;
  const queue = [fromId],
    parents = new Map<string, string | null>([[fromId, null]]);
  for (let i = 0; i < queue.length; i++) {
    const current = entities.find((e) => e.id === queue[i])!;
    if (current.id === toId) {
      const route: string[] = [];
      let id: string | null = toId;
      while (id) {
        route.unshift(id);
        id = parents.get(id) ?? null;
      }
      return route;
    }
    for (const next of entities)
      if (!parents.has(next.id) && wallConnected(current, next, entities)) {
        parents.set(next.id, current.id);
        queue.push(next.id);
      }
  }
  return null;
}
export function wallStandingPose(post: WallPost, entities: WallPost[]) {
  return supportedPose(
    { x: post.x, z: post.z, elevation: 1 },
    post,
    -0.08,
    postYaw(post, entities),
  );
}
export function wallWalkingPose(walk: WallWalk, entities: WallPost[]) {
  const from = entities.find((e) => e.id === walk.fromId),
    to = entities.find((e) => e.id === walk.toId);
  if (!from || !to) return undefined;
  const a = wallStandingPose(from, entities),
    b = wallStandingPose(to, entities),
    t = Math.max(0, Math.min(1, walk.progress));
  return {
    x: a.x + (b.x - a.x) * t,
    z: a.z + (b.z - a.z) * t,
    floor: a.floor + (b.floor - a.floor) * t,
  };
}
