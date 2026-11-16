import { describe, it, expect } from "vitest";
import {
  createTestSettlement,
  equipTestSettlement,
  startTestFire,
  grantTestResources,
} from "../src/qa";
import { validateSave } from "../src/save";
import { getEntities, wallUpgradeAvailable, step } from "../src/simulation";
import { addonsFor } from "../src/addons";
describe("test settlement", () => {
  it("provides a saveable village, supplies and usable fortifications without touching a campaign", () => {
    const w = createTestSettlement(),
      other = createTestSettlement();
    expect(w).toEqual(other);
    expect(validateSave(JSON.parse(JSON.stringify(w)))).toEqual(w);
    expect(addonsFor(w).gems).toBe(500);
    const palisade = getEntities(w).find((e) => e.type === "palisade")!;
    expect(wallUpgradeAvailable(w, palisade.id).ok).toBe(true);
    expect(getEntities(w).filter((e) => e.kind === "archer")).toHaveLength(11);
    for (const type of [
      "castle",
      "market",
      "hospital",
      "stoneBridge",
      "ravine",
      "canal",
      "camelYard",
      "forge",
    ])
      expect(getEntities(w).some((e) => e.type === type)).toBe(true);
    step(w, 0.1);
    expect(w.resources.wood).toBeGreaterThanOrEqual(1000);
    expect(other.time).toBe(0);
  });
});

describe("new facilities in the test settlement", () => {
  it("contains all six buildings, staffed services, a merchant and a ready transport crew", () => {
    const w = createTestSettlement();
    for (const type of [
      "waterGate",
      "wallStairs",
      "shipyard",
      "merchantPost",
      "repairWorkshop",
      "signalTower",
    ])
      expect(
        getEntities(w).some((e) => e.type === type && e.faction === "player"),
      ).toBe(true);
    for (const type of ["shipyard", "repairWorkshop"]) {
      const b = getEntities(w).find((e) => e.type === type)!;
      expect(b.workerId).toBeDefined();
      expect(w.entities[b.workerId!].workplaceId).toBe(b.id);
    }
    expect(getEntities(w).some((e) => e.type === "transportBoat")).toBe(true);
    expect(
      getEntities(w).some(
        (e) =>
          e.tradeRoute &&
          w.entities[e.tradeRoute.homeId].type === "merchantPost",
      ),
    ).toBe(true);
    expect(
      getEntities(w).filter((e) => e.id.startsWith("test-expansion-crew-")),
    ).toHaveLength(3);
    expect(w.testExpansionVersion).toBe(4);
  });
});

describe("test-settlement migration", () => {
  it("is idempotent and leaves progress and resources unchanged", () => {
    const w = createTestSettlement(),
      before = structuredClone(w);
    expect(equipTestSettlement(w)).toBe(false);
    expect(w).toEqual(before);
    const gate = getEntities(w).find((e) => e.type === "waterGate")!;
    delete w.entities[gate.id];
    delete w.testExpansionVersion;
    w.time = 123;
    const hero = getEntities(w).find((e) => e.kind === "hero")!;
    hero.hp = 88;
    const resources = { ...w.resources };
    const ids = Object.keys(w.entities);
    const workerCount = getEntities(w).filter(
      (e) => e.kind === "worker",
    ).length;
    expect(equipTestSettlement(w)).toBe(true);
    expect(w.resources).toEqual(resources);
    expect(w.time).toBe(123);
    expect(hero.hp).toBe(88);
    expect(getEntities(w).filter((e) => e.kind === "worker")).toHaveLength(
      workerCount,
    );
    for (const id of ids) expect(w.entities[id]).toBeDefined();
    expect(w.testExpansionVersion).toBe(4);
  });
});

it("migrates an older test village and offers repeatable fire drills", () => {
  const w = createTestSettlement();
  const station = getEntities(w).find((e) => e.type === "firehouse")!;
  delete w.entities[station.workerId!];
  delete w.entities[station.id];
  delete w.entities["test-fire-drill"];
  w.testExpansionVersion = 2;
  const resources = { ...w.resources };
  const time = w.time;
  expect(equipTestSettlement(w)).toBe(true);
  expect(w.resources).toEqual(resources);
  expect(w.time).toBe(time);
  const firehouse = getEntities(w).find((e) => e.type === "firehouse")!;
  expect(w.entities[firehouse.workerId!].label).toBe("Strażak testowy");
  expect(startTestFire(w).ok).toBe(true);
  for (let i = 0; i < 200; i++) step(w, 0.1);
  expect(w.entities["test-fire-drill"].fire).toBe(0);
  expect(startTestFire(w).ok).toBe(true);
  const count = Object.keys(w.entities).length;
  expect(equipTestSettlement(w)).toBe(false);
  expect(Object.keys(w.entities)).toHaveLength(count);
});

it("grants requested supplies once and preserves the test storage limit", () => {
  const w = createTestSettlement();
  expect(w.resources.wood).toBeGreaterThan(100000);
  const before = structuredClone(w.resources);
  expect(equipTestSettlement(w)).toBe(false);
  expect(w.resources).toEqual(before);
  grantTestResources(w);
  expect(w.resources.iron).toBe(before.iron + 100000);
  step(w, 0.1);
  expect(w.resources.wood).toBeGreaterThanOrEqual(before.wood + 100000);
  expect(validateSave(JSON.parse(JSON.stringify(w))).testResourceCapacity).toBe(
    w.testResourceCapacity,
  );
});

it("adds 100000 of every resource and preserves the increased storage limit", () => {
  const w = createTestSettlement(),
    before = { ...w.resources };
  grantTestResources(w);
  for (const key of ["wood", "stone", "food", "gold", "iron"] as const)
    expect(w.resources[key]).toBe(before[key] + 100000);
  const food = w.resources.food;
  step(w, 0.1);
  expect(w.resources.food).toBeGreaterThanOrEqual(food - 1);
  expect(validateSave(JSON.parse(JSON.stringify(w))).testResourceCapacity).toBe(
    w.testResourceCapacity,
  );
});
