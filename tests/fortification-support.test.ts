import { describe, it, expect } from "vitest";
import {
  supportedPose,
  fortificationSurface,
} from "../src/fortification-support";
describe("grounded fortification defenders", () => {
  it("stands on the wall deck without adding the height of a road underneath", () => {
    const unit = { x: 19, z: 31, elevation: 1 },
      post = { type: "wall", x: 20, z: 31 };
    const earth = supportedPose(unit, post, -0.08),
      road = supportedPose(unit, post, 0.015);
    expect(earth.floor).toBeCloseTo(1.22);
    expect(road.floor).toBeCloseTo(earth.floor);
    expect(road.x).toBeCloseTo(20.06);
    expect(road.z).toBe(31);
  });
  it("uses each physical deck rather than one shared elevation for all posts", () => {
    const unit = { x: 20, z: 20, elevation: 1 };
    expect(
      supportedPose(unit, { type: "tower", x: 20, z: 20 }, 0.015).floor,
    ).toBeCloseTo(1.92);
    expect(
      supportedPose(unit, { type: "stoneTower", x: 20, z: 20 }, 0.015).floor,
    ).toBeCloseTo(2.02);
    expect(
      supportedPose(unit, { type: "palisade", x: 20, z: 20 }, 0.015).floor,
    ).toBeCloseTo(0.92);
    expect(fortificationSurface("palisade").x).toBeGreaterThan(0);
  });
  it("rotates the standing point with the post and interpolates ascent and descent", () => {
    const post = { type: "wall", x: 20, z: 20 },
      unit = { x: 19, z: 20, elevation: 1 };
    const atop = supportedPose(unit, post, -0.08, Math.PI / 2);
    expect(atop.x).toBeCloseTo(20);
    expect(atop.z).toBeCloseTo(19.94);
    const halfway = supportedPose(
      { ...unit, elevation: 0.5 },
      post,
      -0.08,
      Math.PI / 2,
    );
    expect(halfway.x).toBeCloseTo((unit.x + atop.x) / 2);
    expect(halfway.floor).toBeCloseTo((-0.08 + atop.floor) / 2);
    expect(supportedPose({ ...unit, elevation: 0 }, post, 0.015)).toEqual({
      x: unit.x,
      z: unit.z,
      floor: 0.015,
    });
  });
  it("keeps a unit on the ground if its post is no longer available", () => {
    expect(
      supportedPose({ x: 20, z: 21, elevation: 1 }, undefined, 0.015),
    ).toEqual({ x: 20, z: 21, floor: 0.015 });
  });
});
