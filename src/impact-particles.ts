export interface ImpactParticle {
  dust: boolean;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  size: number;
}
/** Small bounded bursts; no accumulating emitters. */
export function impactParticles(wood = false): ImpactParticle[] {
  return Array.from({ length: wood ? 16 : 20 }, (_, i) => {
    const dust = i < 8,
      angle = i * 2.399963;
    return {
      dust,
      vx: Math.cos(angle) * (dust ? 0.45 : 0.8 + (i % 3) * 0.3),
      vy: dust ? 0.45 : 1.2 + (i % 4) * 0.25,
      vz: Math.sin(angle) * (dust ? 0.45 : 0.8 + (i % 3) * 0.3),
      life: dust ? 0.65 + (i % 3) * 0.1 : 0.5 + (i % 4) * 0.1,
      size: dust
        ? 0.17 + (i % 3) * 0.035
        : wood
          ? 0.045
          : 0.055 + (i % 3) * 0.015,
    };
  });
}
export function impactPose(p: ImpactParticle, age: number) {
  const t = Math.max(0, Math.min(age, p.life)),
    f = t / p.life;
  return {
    x: p.vx * t,
    y: p.vy * t - (p.dust ? 0.05 : 3) * t * t,
    z: p.vz * t,
    scale: p.dust ? 1 + f * 2 : 1,
    opacity: (p.dust ? 0.3 : 1) * (1 - f) ** 1.3,
    done: age >= p.life,
  };
}
