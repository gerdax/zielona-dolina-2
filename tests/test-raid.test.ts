import { it, expect } from "vitest";
import {
  createTestSettlement,
  startTestRaid,
  finishTestRaid,
  testRaidEnemies,
  restoreTestDefenses,
} from "../src/qa";
import { step, getEntities } from "../src/simulation";
import { validateSave } from "../src/save";
it("launches one routed wave, sounds alarm and exercises ballista, traps and defenders", () => {
  const w = createTestSettlement(),
    before = { ...w.resources };
  expect(startTestRaid(w).ok).toBe(true);
  expect(w.alarm).toBe(true);
  expect(testRaidEnemies(w)).toHaveLength(6);
  expect(w.resources).toEqual(before);
  expect(startTestRaid(w).ok).toBe(false);
  expect(testRaidEnemies(w)).toHaveLength(6);
  let slow = false,
    shot = false;
  for (let i = 0; i < 900; i++) {
    step(w, 0.1);
    slow ||= testRaidEnemies(w).some((e) => e.slowFactor !== undefined);
    shot ||= getEntities(w).some(
      (e) => e.type === "ballistaTower" && !!e.lastAttack,
    );
  }
  expect(slow).toBe(true);
  expect(shot).toBe(true);
  expect(
    getEntities(w)
      .filter(
        (e) => e.id.startsWith("test-defense-unit-") && e.kind === "soldier",
      )
      .some((e) => !!e.order || Math.hypot(e.x - 20, e.z - 43) < 4),
  ).toBe(true);
  finishTestRaid(w, true);
  expect(w.alarm).toBe(false);
  expect(testRaidEnemies(w)).toHaveLength(0);
});
it("cancels only exercise enemies and restores the prior alarm across saving", () => {
  const w = createTestSettlement();
  w.alarm = true;
  const real = {
    id: "real-enemy",
    kind: "enemy" as const,
    type: "bandit",
    label: "Real",
    x: 55,
    z: 50,
    hp: 100,
    maxHp: 100,
    faction: "enemy" as const,
  };
  w.entities[real.id] = real;
  expect(startTestRaid(w).ok).toBe(true);
  const restored = validateSave(JSON.parse(JSON.stringify(w)));
  expect(finishTestRaid(restored, true)).toBe(true);
  expect(restored.entities[real.id]).toBeDefined();
  expect(restored.alarm).toBe(true);
  expect(finishTestRaid(restored, true)).toBe(false);
});
it("rejects missing facilities without changing the world", () => {
  const w = createTestSettlement();
  const b = getEntities(w).find((e) => e.type === "spikePit")!;
  delete w.entities[b.id];
  const before = structuredClone(w);
  expect(startTestRaid(w).ok).toBe(false);
  expect(w).toEqual(before);
});

it("offers three wave sizes with increasing armies and siege engines", () => {
  for (const [level, count, rams, catapults] of [
    ["small", 6, 1, 0],
    ["medium", 15, 2, 1],
    ["large", 31, 4, 3],
  ] as const) {
    const w = createTestSettlement();
    expect(startTestRaid(w, level).ok).toBe(true);
    const wave = testRaidEnemies(w);
    expect(wave).toHaveLength(count);
    expect(wave.filter((e) => e.type === "ram")).toHaveLength(rams);
    expect(wave.filter((e) => e.type === "catapult")).toHaveLength(catapults);
    expect(new Set(wave.map((e) => e.x + "," + e.z)).size).toBe(count);
    expect(wave.every((e) => e.order?.path?.length)).toBe(true);
    expect(validateSave(JSON.parse(JSON.stringify(w)))).toBeDefined();
    finishTestRaid(w, true);
    expect(testRaidEnemies(w)).toHaveLength(0);
  }
});

it("repairs and rebuilds defense for a repeat raid without charging or replacing unrelated buildings", () => {
  const w = createTestSettlement();
  expect(startTestRaid(w).ok).toBe(true);
  expect(restoreTestDefenses(w).ok).toBe(false);
  finishTestRaid(w, true);
  const gate = getEntities(w).find((e) => e.type === "fortifiedGate")!,
    tower = getEntities(w).find((e) => e.type === "ballistaTower")!;
  const house = getEntities(w).find((e) => e.type === "house")!;
  house.hp -= 10;
  const houseHp = house.hp;
  gate.hp -= 200;
  tower.originalType = tower.type;
  tower.originalFaction = "player";
  tower.kind = "ruin";
  tower.type = "ruin";
  tower.faction = "neutral";
  tower.hp = 100;
  delete w.entities["test-defense-unit-4"];
  const saved = validateSave(JSON.parse(JSON.stringify(w))),
    resources = { ...saved.resources };
  expect(restoreTestDefenses(saved).ok).toBe(true);
  expect(saved.resources).toEqual(resources);
  expect(saved.entities[tower.id].type).toBe("ballistaTower");
  expect(saved.entities[tower.id].hp).toBe(saved.entities[tower.id].maxHp);
  expect(saved.entities[gate.id].hp).toBe(saved.entities[gate.id].maxHp);
  expect(saved.entities[house.id].hp).toBe(houseHp);
  expect(saved.entities["test-defense-unit-4"]).toBeDefined();
  expect(startTestRaid(saved).ok).toBe(true);
});
