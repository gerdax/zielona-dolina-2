import { describe, it, expect } from "vitest";
import {
  createWorld,
  createNextExpedition,
  command,
  getEntities,
  instantAddonAvailable,
} from "../src/simulation";
import { addonsFor } from "../src/addons";
import { validateSave } from "../src/save";
const funded = () => {
  const w = createWorld();
  addonsFor(w).gems = 200;
  return w;
};
describe("instant settlement addons", () => {
  it("delivers repeatable supplies to this settlement and rejects duplicate purchase IDs", () => {
    const w = funded(),
      before = getEntities(w).length,
      time = w.time;
    expect(
      command(w, {
        type: "buyInstantAddon",
        instantId: "builders",
        purchaseId: "one",
      }).ok,
    ).toBe(true);
    expect(w.resources.wood).toBe(360);
    expect(w.resources.stone).toBe(200);
    expect(addonsFor(w).gems).toBe(175);
    expect(
      command(w, {
        type: "buyInstantAddon",
        instantId: "builders",
        purchaseId: "one",
      }).ok,
    ).toBe(false);
    expect(w.resources.wood).toBe(360);
    expect(addonsFor(w).gems).toBe(175);
    expect(
      command(w, {
        type: "buyInstantAddon",
        instantId: "builders",
        purchaseId: "two",
      }).ok,
    ).toBe(true);
    expect(w.resources.wood).toBe(560);
    expect(getEntities(w)).toHaveLength(before);
    expect(w.time).toBe(time);
  });
  it("does not charge for insufficient gems, missing cargo room or a defeated campaign", () => {
    const w = funded();
    w.resources.wood = 650;
    const resources = { ...w.resources };
    expect(instantAddonAvailable(w, "builders").message).toContain(
      "Brak miejsca",
    );
    expect(
      command(w, { type: "buyInstantAddon", instantId: "builders" }).ok,
    ).toBe(false);
    expect(addonsFor(w).gems).toBe(200);
    expect(w.resources).toEqual(resources);
    addonsFor(w).gems = 9;
    expect(command(w, { type: "buyInstantAddon", instantId: "food" }).ok).toBe(
      false,
    );
    expect(addonsFor(w).gems).toBe(9);
    w.defeated = true;
    addonsFor(w).gems = 200;
    expect(command(w, { type: "buyInstantAddon", instantId: "gold" }).ok).toBe(
      false,
    );
    expect(addonsFor(w).gems).toBe(200);
  });
  it("creates distinct real archers, workers and mounts without replacing existing units", () => {
    const w = funded(),
      original = getEntities(w)
        .filter((e) => ["hero", "archer", "worker", "horse"].includes(e.kind))
        .map((e) => e.id);
    const count = (type: string) =>
      getEntities(w).filter((e) => e.type === type).length;
    const archers = count("archer"),
      workers = count("worker"),
      horses = count("horse");
    for (const instantId of ["archers", "workers", "horse", "camel"] as const)
      expect(command(w, { type: "buyInstantAddon", instantId }).ok).toBe(true);
    expect(count("archer")).toBe(archers + 3);
    expect(count("worker")).toBe(workers + 2);
    expect(count("horse")).toBe(horses + 1);
    expect(count("camel")).toBe(1);
    for (const id of original) expect(w.entities[id]).toBeDefined();
    const newUnits = getEntities(w).filter(
      (e) =>
        ["archer", "worker", "horse"].includes(e.kind) &&
        !original.includes(e.id),
    );
    expect(new Set(newUnits.map((e) => e.x + "," + e.z)).size).toBe(
      newUnits.length,
    );
    expect(
      newUnits.filter((e) => e.kind === "archer").every((e) => e.maxHp === 70),
    ).toBe(true);
  });
  it("heals living friendly units and repairs friendly buildings without reviving ruins or buffing enemies", () => {
    const w = funded(),
      h = getEntities(w).find((e) => e.kind === "hero")!,
      worker = getEntities(w).find((e) => e.kind === "worker")!,
      building = getEntities(w).find((e) => e.type === "house")!,
      enemy = getEntities(w).find((e) => e.kind === "enemy")!,
      ruin = getEntities(w).find((e) => e.kind === "ruin")!;
    h.hp = 70;
    worker.hp = 10;
    building.hp = 10;
    enemy.hp = 5;
    const ruinHp = ruin.hp;
    expect(
      command(w, { type: "buyInstantAddon", instantId: "healing" }).ok,
    ).toBe(true);
    expect(h.hp).toBe(145);
    expect(worker.hp).toBe(40);
    expect(building.hp).toBe(10);
    expect(enemy.hp).toBe(5);
    expect(
      command(w, { type: "buyInstantAddon", instantId: "healing" }).ok,
    ).toBe(true);
    expect(h.hp).toBe(h.maxHp);
    expect(worker.hp).toBe(worker.maxHp);
    const gems = addonsFor(w).gems;
    expect(
      command(w, { type: "buyInstantAddon", instantId: "healing" }).ok,
    ).toBe(false);
    expect(addonsFor(w).gems).toBe(gems);
    expect(
      command(w, { type: "buyInstantAddon", instantId: "repairs" }).ok,
    ).toBe(true);
    expect(building.hp).toBe(Math.min(building.maxHp, 10 + building.maxHp / 2));
    expect(ruin.hp).toBe(ruinHp);
    expect(ruin.kind).toBe("ruin");
  });
  it("requires free room for the whole unit package before spending gems", () => {
    const w = funded(),
      base = getEntities(w).find((e) => e.type === "hall")!;
    for (let dx = -6; dx <= 6; dx++)
      for (let dz = -6; dz <= 6; dz++) {
        const id = `block:${dx}:${dz}`;
        w.entities[id] = {
          ...base,
          id,
          type: "wall",
          x: base.x + dx,
          z: base.z + dz,
        };
      }
    const n = getEntities(w).length;
    expect(
      command(w, { type: "buyInstantAddon", instantId: "archers" }).ok,
    ).toBe(false);
    expect(getEntities(w)).toHaveLength(n);
    expect(addonsFor(w).gems).toBe(200);
  });
  it("recovers a saved pending purchase exactly once and saves completed effects without duplication", () => {
    const w = funded();
    expect(
      command(w, {
        type: "buyInstantAddon",
        instantId: "builders",
        purchaseId: "pending",
        deferEffect: true,
      }).ok,
    ).toBe(true);
    expect(w.resources.wood).toBe(160);
    expect(addonsFor(w).gems).toBe(175);
    const loaded = validateSave(JSON.parse(JSON.stringify(w)));
    expect(loaded.resources.wood).toBe(360);
    expect(addonsFor(loaded).instantPurchases!.pending.status).toBe("complete");
    const again = validateSave(JSON.parse(JSON.stringify(loaded)));
    expect(again.resources.wood).toBe(360);
    expect(addonsFor(again).gems).toBe(175);
    expect(
      command(again, { type: "claimInstantAddon", purchaseId: "pending" }).ok,
    ).toBe(false);
    expect(again.resources.wood).toBe(360);
  });
  it("refunds a blocked or cancelled pending purchase once, with no effect left behind", () => {
    const w = funded();
    command(w, {
      type: "buyInstantAddon",
      instantId: "food",
      purchaseId: "blocked",
      deferEffect: true,
    });
    w.resources.food = 690;
    const loaded = validateSave(JSON.parse(JSON.stringify(w)));
    expect(loaded.resources.food).toBe(690);
    expect(addonsFor(loaded).gems).toBe(200);
    expect(addonsFor(loaded).instantPurchases!.blocked.status).toBe("refunded");
    expect(validateSave(JSON.parse(JSON.stringify(loaded))).addons!.gems).toBe(
      200,
    );
    command(w, {
      type: "buyInstantAddon",
      instantId: "gold",
      purchaseId: "cancelled",
      deferEffect: true,
    });
    expect(
      command(w, { type: "cancelInstantAddon", purchaseId: "cancelled" }).ok,
    ).toBe(true);
    const coins = w.resources.gold,
      gems = addonsFor(w).gems;
    expect(
      command(w, { type: "cancelInstantAddon", purchaseId: "cancelled" }).ok,
    ).toBe(false);
    expect(w.resources.gold).toBe(coins);
    expect(addonsFor(w).gems).toBe(gems);
  });
  it("keeps historical receipts readable across price or catalogue changes", () => {
    const w = funded();
    command(w, {
      type: "buyInstantAddon",
      instantId: "gold",
      purchaseId: "old",
      deferEffect: true,
    });
    const old = JSON.parse(JSON.stringify(w));
    old.addons.instantPurchases.old.addonId = "retired-addon";
    const loaded = validateSave(old);
    expect(addonsFor(loaded).gems).toBe(200);
    expect(loaded.resources.gold).toBe(70);
    expect(addonsFor(loaded).instantPurchases!.old.status).toBe("refunded");
    const past = funded();
    command(past, {
      type: "buyInstantAddon",
      instantId: "gold",
      purchaseId: "past",
    });
    const completed = JSON.parse(JSON.stringify(past));
    completed.addons.instantPurchases.past.price = 16;
    expect(validateSave(completed).resources.gold).toBe(270);
  });
  it("does not carry consumable effects or pending orders to a new expedition", () => {
    const w = funded();
    command(w, {
      type: "buyInstantAddon",
      instantId: "gold",
      purchaseId: "used",
    });
    const next = createNextExpedition(w);
    expect(next.resources.gold).toBe(70);
    expect(addonsFor(next).gems).toBe(185);
    expect(addonsFor(next).instantPurchases).toEqual({});
    command(w, {
      type: "buyInstantAddon",
      instantId: "gold",
      purchaseId: "unfinished",
      deferEffect: true,
    });
    expect(() => createNextExpedition(w)).toThrow("Poczekaj");
    const bad = JSON.parse(JSON.stringify(w));
    bad.addons.instantPurchases.unfinished.price = -10;
    expect(() => validateSave(bad)).toThrow("Uszkodzony zapis klejnotów");
  });
});
