import { it, expect } from "vitest";
import {
  createWorld,
  command,
  getEntities,
  step,
  storageCapacity,
  type Entity,
} from "../src/simulation";
import { validateSave } from "../src/save";
function scene() {
  const w = createWorld();
  const hero = getEntities(w).find((e) => e.kind === "hero")!;
  hero.x = 20;
  hero.z = 20;
  w.entities = { [hero.id]: hero };
  w.resources = { wood: 300, stone: 300, food: 300, gold: 300, iron: 0 };
  w.raidTimer = 1e8;
  w.nextMerchantAt = 1e8;
  return { w, hero };
}
function building(
  w: ReturnType<typeof createWorld>,
  type: string,
  x = 22,
  z = 20,
) {
  const e: Entity = {
    id: type,
    kind: "building",
    type,
    label: type,
    x,
    z,
    hp: 180,
    maxHp: 180,
    faction: "player",
  };
  w.entities[e.id] = e;
  return e;
}
function run(w: ReturnType<typeof createWorld>, seconds: number) {
  for (let i = 0; i < seconds * 10; i++) step(w, 0.1);
}
it("granaries expand only food storage and ignore destroyed or foreign buildings", () => {
  const { w } = scene();
  building(w, "granary");
  expect(storageCapacity(w, "food")).toBe(900);
  expect(storageCapacity(w, "stone")).toBe(400);
  w.resources.food = 850;
  run(w, 1);
  expect(w.resources.food).toBeGreaterThan(800);
  w.entities.granary.hp = 0;
  expect(storageCapacity(w, "food")).toBe(400);
  w.entities.granary.hp = 100;
  w.entities.granary.faction = "enemy";
  expect(storageCapacity(w, "food")).toBe(400);
});
it("stable purchases a real horse once per paid command", () => {
  const { w } = scene();
  building(w, "stable");
  const gold = w.resources.gold;
  expect(command(w, { type: "buyHorse", buildingId: "stable" }).ok).toBe(true);
  expect(getEntities(w).filter((e) => e.kind === "horse")).toHaveLength(1);
  expect(w.resources.gold).toBe(gold - 25);
  w.resources.gold = 0;
  expect(command(w, { type: "buyHorse", buildingId: "stable" }).ok).toBe(false);
  expect(getEntities(w).filter((e) => e.kind === "horse")).toHaveLength(1);
});
it("inn deliveries pay once, cooldown survives save and rest does not stack", () => {
  const { w, hero } = scene();
  building(w, "inn");
  const gold = w.resources.gold;
  expect(command(w, { type: "innDelivery", buildingId: "inn" }).ok).toBe(true);
  expect(w.resources.gold).toBe(gold + 25);
  expect(command(w, { type: "innDelivery", buildingId: "inn" }).ok).toBe(false);
  const saved = JSON.parse(JSON.stringify(w));
  expect(validateSave(saved).entities.inn.innReadyAt).toBe(90);
  expect(command(saved, { type: "innDelivery", buildingId: "inn" }).ok).toBe(
    false,
  );
  hero.hp = 50;
  building(w, "stable", 21, 20);
  run(w, 1);
  expect(hero.hp).toBeCloseTo(52, 0);
});
it("only an active nearby mill boosts fields, without stacking mills", () => {
  const { w, hero } = scene();
  const field = building(w, "field", 20, 20);
  field.progress = 9.95;
  field.workerId = hero.id;
  hero.order = { type: "work", targetId: field.id };
  const mill = building(w, "mill", 23, 20);
  const worker: Entity = {
    ...hero,
    id: "miller",
    kind: "worker",
    x: 23,
    z: 19,
    order: { type: "work", targetId: mill.id },
    workplaceId: mill.id,
  };
  w.entities[worker.id] = worker;
  mill.workerId = worker.id;
  const food = w.resources.food;
  step(w, 0.1);
  expect(w.resources.food - food).toBeCloseTo(3.75);
});
