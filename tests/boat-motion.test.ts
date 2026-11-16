import { describe, it, expect } from "vitest";
import {
  boatHeading,
  boatHeight,
  turnBoat,
  BOAT_FLOOR_HEIGHT,
} from "../src/boat-motion";
describe("boat rendering motion", () => {
  it("points its actual bow along all cardinal and diagonal directions", () => {
    for (const [x, z] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [-1, 1],
    ]) {
      const yaw = boatHeading(x, z),
        length = Math.hypot(x, z);
      expect(Math.cos(yaw)).toBeCloseTo(x / length);
      expect(-Math.sin(yaw)).toBeCloseTo(z / length);
    }
  });
  it("keeps floor above water and raised ripple geometry throughout bobbing", () => {
    for (let i = 0; i < 1000; i++) {
      const height = boatHeight(-0.04, i / 60);
      expect(height + BOAT_FLOOR_HEIGHT).toBeGreaterThan(0.019);
      expect(height).toBeGreaterThanOrEqual(-0.0551);
      expect(height).toBeLessThanOrEqual(-0.0249);
      expect(boatHeight(-0.04, i / 60)).toBe(height);
    }
  });
});

describe("smooth boat steering", () => {
  it("limits rotation and keeps turning between simulation updates", () => {
    let yaw = turnBoat(0, Math.PI / 2, 1 / 60);
    expect(yaw).toBeGreaterThan(0);
    expect(yaw).toBeLessThan(0.045);
    for (let i = 0; i < 90; i++) yaw = turnBoat(yaw, Math.PI / 2, 1 / 60);
    expect(yaw).toBeCloseTo(Math.PI / 2, 2);
  });
  it("crosses the angle seam by the short arc", () => {
    const current = Math.PI - 0.02,
      target = -Math.PI + 0.02;
    const next = turnBoat(current, target, 1 / 60);
    expect(next).toBeGreaterThan(current);
    expect(next - current).toBeLessThan(0.02);
  });
  it("is stable across display frame rates and does not overshoot", () => {
    const run = (fps: number) => {
      let yaw = 0;
      for (let i = 0; i < fps; i++) yaw = turnBoat(yaw, 1, fps ** -1);
      return yaw;
    };
    expect(Math.abs(run(30) - run(144))).toBeLessThan(0.01);
    expect(run(60)).toBeLessThanOrEqual(1);
    expect(turnBoat(1, 1, 1 / 60)).toBe(1);
    expect(turnBoat(1, 2, 0)).toBe(1);
  });
});
