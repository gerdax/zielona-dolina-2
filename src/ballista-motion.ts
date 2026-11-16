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

/** Three-second firing cycle: release, recoil, then a visible winch reload. */
export function ballistaPose(age: number) {
  if (!Number.isFinite(age) || age < 0)
    return { draw: 1, recoil: 0, loaded: true, winch: Math.PI * 4 };
  const reload = Math.max(0, Math.min(1, (age - 0.35) / 2.15));
  const draw = age < 0.08 ? 1 - age / 0.08 : reload * reload * (3 - 2 * reload);
  return {
    draw,
    recoil: age < 0.24 ? -0.14 * Math.sin((Math.PI * age) / 0.24) : 0,
    loaded: age >= 0.55,
    winch: draw * Math.PI * 4,
  };
}
