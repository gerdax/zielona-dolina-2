export function damageStage(hp: number, maxHp: number) {
  const ratio = hp / Math.max(1, maxHp);
  return ratio > 0.75 ? 0 : ratio > 0.45 ? 1 : ratio > 0.2 ? 2 : 3;
}
export function collapsePose(age: number) {
  const t = Math.max(0, Math.min(1, age / 0.85));
  return {
    sink: t * t * 1.25,
    tilt: t * 0.38,
    scale: Math.max(0.03, 1 - t * 0.95),
    done: age >= 0.85,
  };
}
