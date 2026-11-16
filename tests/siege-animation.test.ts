import { describe, it, expect } from "vitest";
import { siegePose } from "../src/siege-animation";
import { createWorld, getEntities, step, type Entity } from "../src/simulation";
import { validateSave } from "../src/save";
describe("siege attack animation", () => {
  it("winds up, releases the stone, strikes and reloads", () => {
    expect(siegePose(-1)).toEqual(siegePose(2));
    expect(siegePose(0.15).arm).toBeLessThan(0);
    expect(siegePose(0.15).ram).toBeLessThan(0);
    expect(siegePose(0.3).loaded).toBe(false);
    expect(siegePose(0.3).ram).toBeCloseTo(0.42);
    expect(siegePose(0.38).arm).toBeCloseTo(1.7);
    expect(siegePose(0.95).loaded).toBe(true);
    expect(siegePose(1)).toEqual({ arm: 0, ram: 0, loaded: true });
  });
  for (const type of ["catapult", "ram"])
    it(`records the real target only on an actual ${type} hit`, () => {
      const w = createWorld(),
        hero = getEntities(w).find((e) => e.kind === "hero")!;
      const siege: Entity = {
        ...hero,
        id: "siege",
        kind: "soldier",
        type,
        x: 20,
        z: 20,
        hp: 200,
        maxHp: 200,
        order: { type: "attack", targetId: "target" },
      };
      const target: Entity = {
        ...hero,
        id: "target",
        kind: "building",
        type: "wall",
        x: 20,
        z: 21,
        faction: "enemy",
        hp: 1000,
        maxHp: 1000,
      };
      w.entities = { [hero.id]: hero, siege, target };
      w.raidTimer = 1e8;
      step(w, 0.1);
      expect(siege.lastAttack?.targetId).toBe("target");
      expect(siege.lastAttack?.x).toBe(20);
      expect(siege.lastAttack?.z).toBe(21);
      expect(target.hp).toBe(1000 - (type === "ram" ? 36 : 32));
      const attack = structuredClone(siege.lastAttack);
      step(w, 0.1);
      expect(siege.lastAttack).toEqual(attack);
      expect(
        validateSave(JSON.parse(JSON.stringify(w))).entities.siege.lastAttack,
      ).toEqual(attack);
    });
});
