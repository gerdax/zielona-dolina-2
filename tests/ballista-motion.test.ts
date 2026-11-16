import { it, expect } from "vitest";
import { turnBallista } from "../src/ballista-motion";
it("turns gradually, changes targets without snapping and takes the shortest arc", () => {
  const first = turnBallista(0, Math.PI / 2, 1 / 60);
  expect(first).toBeGreaterThan(0);
  expect(first).toBeLessThanOrEqual(3.2 / 60);
  const changed = turnBallista(first, -Math.PI / 2, 1 / 60);
  expect(Math.abs(changed - first)).toBeLessThanOrEqual(3.2 / 60);
  const wrap = turnBallista(Math.PI - 0.02, -Math.PI + 0.02, 1 / 60);
  expect(wrap).toBeGreaterThan(Math.PI - 0.02);
  expect(wrap).toBeLessThan(Math.PI + 0.02);
});
it("converges at different frame rates and stays still without elapsed time", () => {
  for (const fps of [30, 60, 144]) {
    let yaw = 0;
    for (let i = 0; i < fps * 3; i++)
      yaw = turnBallista(yaw, Math.PI / 2, 1 / fps);
    expect(yaw).toBeCloseTo(Math.PI / 2, 5);
    expect(turnBallista(yaw, 0, 0)).toBe(yaw);
  }
});
