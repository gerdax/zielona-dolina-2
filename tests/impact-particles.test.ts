import { describe, it, expect } from "vitest";
import { impactParticles, impactPose } from "../src/impact-particles";
describe("siege impact bursts", () => {
  it("keeps wood and masonry bursts small and separates dust from chips", () => {
    for (const wood of [true, false]) {
      const p = impactParticles(wood);
      expect(p.length).toBeLessThanOrEqual(20);
      expect(p.filter((x) => x.dust)).toHaveLength(8);
      expect(p.some((x) => !x.dust)).toBe(true);
    }
  });
  it("throws fragments, expands dust and completely fades every particle", () => {
    for (const p of impactParticles()) {
      const start = impactPose(p, 0),
        mid = impactPose(p, p.life * 0.5),
        end = impactPose(p, p.life);
      expect(start.done).toBe(false);
      expect(mid.opacity).toBeLessThan(start.opacity);
      expect(end.opacity).toBe(0);
      expect(end.done).toBe(true);
      if (p.dust) expect(mid.scale).toBeGreaterThan(start.scale);
      else expect(impactPose(p, 0.15).y).toBeGreaterThan(0);
      for (const v of Object.values(mid))
        if (typeof v === "number") expect(Number.isFinite(v)).toBe(true);
    }
  });
});
