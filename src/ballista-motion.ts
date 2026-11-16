/** Smooth aim along the shortest arc; the tower's orientation is independent. */
export function turnBallista(current: number, target: number, dt: number) {
  if (
    !Number.isFinite(current) ||
    !Number.isFinite(target) ||
    !Number.isFinite(dt) ||
    dt <= 0
  )
    return current;
  const delta = Math.atan2(
    Math.sin(target - current),
    Math.cos(target - current),
  );
  const limit = 3.2 * dt;
  return (
    current + Math.max(-limit, Math.min(limit, delta * (1 - Math.exp(-8 * dt))))
  );
}
