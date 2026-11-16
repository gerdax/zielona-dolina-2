/** The boat model's bow points along local +X; Three.js yaw maps it to (cos(yaw), -sin(yaw)). */
export const boatHeading = (dx: number, dz: number) => Math.atan2(-dz, dx);
export const BOAT_FLOOR_HEIGHT = 0.12;
/** Absolute water-relative height, never accumulated from the previous rendered frame. */
export const boatHeight = (water: number, time: number) =>
  water + Math.sin(time * 1.7) * 0.015;

/** Follow the shortest arc, with gentle easing and a maximum rudder turn rate. */
export function turnBoat(current: number, target: number, dt: number) {
  if (!Number.isFinite(dt) || dt <= 0) return current;
  const delta = Math.atan2(
    Math.sin(target - current),
    Math.cos(target - current),
  );
  const step = delta * (1 - Math.exp(-7 * dt));
  const limit = 2.6 * dt;
  return current + Math.max(-limit, Math.min(limit, step));
}
