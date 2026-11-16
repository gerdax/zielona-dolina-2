import { describe, it, expect } from "vitest";
import {
  createWorld,
  createNextExpedition,
  step,
  getEntities,
} from "../src/simulation";
import {
  addonsFor,
  collectRaidGems,
  collectTaskGems,
  progressFor,
  rewardTasks,
} from "../src/addons";
import { validateSave } from "../src/save";
function raid() {
  const w = createWorld();
  w.raidTimer = 0;
  step(w, 0.1);
  const enemies = getEntities(w).filter((e) => e.type === "raider");
  expect(enemies).toHaveLength(4);
  return { w, enemies };
}
describe("gem rewards for raids and tasks", () => {
  it("awards only after all members of a spawned wave die, once per wave", () => {
    const { w, enemies } = raid();
    enemies[0].hp = 0;
    step(w, 0.1);
    expect(addonsFor(w).gems).toBe(0);
    const b = validateSave(JSON.parse(JSON.stringify(w)));
    for (const e of getEntities(b).filter((e) => e.type === "raider")) e.hp = 0;
    step(b, 0.1);
    expect(addonsFor(b).gems).toBe(10);
    expect(collectRaidGems(b)).toBe(0);
    const again = validateSave(JSON.parse(JSON.stringify(b)));
    expect(addonsFor(again).gems).toBe(10);
    again.raidTimer = 0;
    step(again, 0.1);
    for (const e of getEntities(again).filter((e) => e.type === "raider"))
      e.hp = 0;
    step(again, 0.1);
    expect(addonsFor(again).gems).toBe(20);
  });
  it("does not reward disappeared attackers or a defense that lost its home", () => {
    const lost = raid();
    const home = lost.w.entities[addonsFor(lost.w).raids!["1"].homeId];
    home.hp = 0;
    for (const e of lost.enemies) e.hp = 0;
    step(lost.w, 0.1);
    expect(addonsFor(lost.w).gems).toBe(0);
    const missing = raid();
    delete missing.w.entities[missing.enemies[0].id];
    for (const e of missing.enemies.slice(1)) e.hp = 0;
    step(missing.w, 0.1);
    expect(addonsFor(missing.w).gems).toBe(0);
    expect(addonsFor(missing.w).raids!["1"].resolved).toBe(false);
  });
  it("does not invent rewards for historical raid numbers without surviving evidence", () => {
    const w = createWorld();
    w.raidNumber = 15;
    expect(collectRaidGems(w)).toBe(0);
    expect(addonsFor(w).gems).toBe(0);
  });
  it("pays completed tasks retrospectively without duplicates after reloading or rebuilding", () => {
    const w = createWorld(),
      town = getEntities(w).find((e) => e.kind === "town")!,
      base = getEntities(w).find(
        (e) => e.kind === "building" && e.faction === "player",
      )!;
    w.entities.quarry = { ...base, id: "quarry", type: "quarry", x: 8, z: 20 };
    town.relation = "allied";
    w.objectives.ruinsRestored = true;
    w.victory = true;
    expect(collectTaskGems(w)).toBe(50);
    expect(collectTaskGems(w)).toBe(0);
    const b = validateSave(JSON.parse(JSON.stringify(w)));
    expect(addonsFor(b).gems).toBe(50);
    delete b.entities.quarry;
    b.entities.rebuilt = {
      ...base,
      id: "rebuilt",
      type: "quarry",
      x: 8,
      z: 20,
    };
    expect(collectTaskGems(b)).toBe(0);
    expect(rewardTasks(b).find((t) => t.id === "quarry")!.amount).toBe(5);
  });
  it("starts new expedition task and raid records afresh while keeping the wallet", () => {
    const { w } = raid();
    for (const e of getEntities(w).filter((e) => e.type === "raider")) e.hp = 0;
    step(w, 0.1);
    progressFor(w).tradeReturns = 10;
    collectTaskGems(w);
    const gems = addonsFor(w).gems,
      next = createNextExpedition(w);
    expect(addonsFor(next).gems).toBe(gems);
    expect(addonsFor(next).rewards).toEqual({});
    expect(addonsFor(next).raids).toEqual({});
    expect(progressFor(next).tradeReturns).toBe(0);
    expect(collectTaskGems(next)).toBe(0);
  });
  it("uses completed trade returns for milestones and migrates live merchant history", () => {
    const w = createWorld();
    progressFor(w).tradeReturns = 1;
    expect(collectTaskGems(w)).toBe(5);
    progressFor(w).tradeReturns = 10;
    expect(collectTaskGems(w)).toBe(15);
    expect(collectTaskGems(w)).toBe(0);
    const bad = JSON.parse(JSON.stringify(w));
    bad.addons.progress.tradeReturns = -1;
    expect(() => validateSave(bad)).toThrow("Uszkodzony zapis klejnotów");
  });
});
