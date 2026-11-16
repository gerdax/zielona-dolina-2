import { buildingDefs } from "./content";
/** Model-local walking surfaces; elevation in saves remains a normalized climb. */
export function fortificationSurface(type: string) {
  const family = buildingDefs[type]?.behavior || type;
  if (family === "tower")
    return {
      height: type === "bastion" ? 1.3 : type === "stoneTower" ? 2.1 : 2,
      x: 0,
      z: 0,
    };
  if (family === "wall")
    return buildingDefs[type]?.material === "wood"
      ? { height: 1, x: 0.1, z: 0 }
      : { height: 1.3, x: 0.06, z: 0 };
  return { height: 0, x: 0, z: 0 };
}
export function supportedPose(
  unit: { x: number; z: number; elevation?: number },
  post: { type: string; x: number; z: number } | undefined,
  ground: number,
  yaw = 0,
) {
  if (!post) return { x: unit.x, z: unit.z, floor: ground };
  const t = Math.max(0, Math.min(1, unit.elevation || 0)),
    surface = fortificationSurface(post.type);
  const x = post.x + surface.x * Math.cos(yaw) + surface.z * Math.sin(yaw),
    z = post.z - surface.x * Math.sin(yaw) + surface.z * Math.cos(yaw);
  return {
    x: unit.x + (x - unit.x) * t,
    z: unit.z + (z - unit.z) * t,
    floor: ground + (-0.08 + surface.height - ground) * t,
  };
}
