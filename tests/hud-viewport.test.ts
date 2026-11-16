import { it, expect } from "vitest";
import { hudViewport, resourceAmount } from "../src/hud-viewport";
it("fits the HUD to a panned three-times pinch-zoom viewport", () => {
  const v = {
      offsetLeft: 175,
      offsetTop: 279,
      width: 201,
      height: 282.333,
      scale: 3,
    },
    h = hudViewport(v, 603, 847);
  expect(h.x).toBe(175);
  expect(h.y).toBe(279);
  expect(h.width * h.scale).toBeCloseTo(201);
  expect(h.height * h.scale).toBeCloseTo(v.height);
  expect(h.x + h.width * h.scale).toBeCloseTo(v.offsetLeft + v.width);
});
it("retains a normal layout and compacts large resource counts", () => {
  expect(hudViewport(undefined, 1366, 768)).toEqual({
    x: 0,
    y: 0,
    width: 1366,
    height: 768,
    scale: 1,
  });
  expect(resourceAmount(985)).toBe("985");
  expect(resourceAmount(1999932).length).toBeLessThan(8);
});
