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

it("releases the string, recoils and visibly reloads before the next shot", async () => {
  const { ballistaPose } = await import("../src/ballista-motion");
  expect(ballistaPose(-1).loaded).toBe(true);
  expect(ballistaPose(0).draw).toBe(1);
  expect(ballistaPose(0.08).draw).toBe(0);
  expect(ballistaPose(0.12).recoil).toBeLessThan(-0.1);
  expect(ballistaPose(0.3).recoil).toBe(0);
  expect(ballistaPose(0.4).loaded).toBe(false);
  expect(ballistaPose(1).loaded).toBe(true);
  expect(ballistaPose(1).draw).toBeLessThan(ballistaPose(2).draw);
  expect(ballistaPose(2.6).draw).toBe(1);
  for (let t = 0; t < 6; t += 0.013)
    for (const value of Object.values(ballistaPose(t)))
      if (typeof value === "number") expect(Number.isFinite(value)).toBe(true);
});
