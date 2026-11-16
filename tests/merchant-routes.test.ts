import { describe, it, expect } from "vitest";
import { createWorld, command, getEntities, step } from "../src/simulation";
import { validateSave } from "../src/save";
function run(w: ReturnType<typeof createWorld>, seconds: number) {
  for (let i = 0; i < seconds * 10; i++) step(w, 0.1);
}
function setup() {
  const w = createWorld(),
    h = getEntities(w).find((e) => e.kind === "hero")!,
    base = getEntities(w).find((e) => e.type === "warehouse")!,
    town = getEntities(w).find((e) => e.kind === "town")!;
  const market = { ...base, type: "market", x: 20, z: 30 };
  h.x = 10;
  h.z = 25;
  town.x = 37;
  town.z = 30;
  w.entities = Object.fromEntries(
    [...getEntities(w).filter((e) => e.type === "bridge"), h, market, town].map(
      (e) => [e.id, e],
    ),
  );
  w.resources = { wood: 200, stone: 100, food: 100, gold: 200, iron: 20 };
  w.raidTimer = 1e8;
  w.nextMerchantAt = 1e8;
  expect(command(w, { type: "hireMerchant", buildingId: market.id }).ok).toBe(
    true,
  );
  const trader = getEntities(w).find((e) => e.tradeRoute)!;
  return { w, market, town, trader };
}
describe("owned merchant routes", () => {
  it("hires a persistent merchant and pays for a real cargo only after returning", () => {
    const { w, town, trader } = setup(),
      id = trader.id,
      gold = w.resources.gold,
      wood = w.resources.wood;
    expect(gold).toBe(170);
    expect(wood).toBe(180);
    expect(
      command(w, {
        type: "dispatchMerchant",
        actorId: id,
        targetId: town.id,
        resource: "wood",
        amount: 20,
        repeat: false,
      }).ok,
    ).toBe(true);
    expect(w.resources.wood).toBe(wood - 20);
    expect(w.resources.gold).toBe(gold);
    run(w, 30);
    expect(w.entities[id]).toBe(trader);
    expect(trader.tradeRoute!.phase).toBe("idle");
    expect(w.resources.gold).toBe(gold + 35);
    expect(trader.tradeRoute!.cargo.gold).toBe(0);
    expect(trader.tradeRoute!.trips).toBe(1);
    expect(w.addons!.progress!.tradeReturns).toBe(1);
  });
  it("reuses the same cart on a permanent route and ends after the current lap", () => {
    const { w, town, trader } = setup();
    command(w, {
      type: "dispatchMerchant",
      actorId: trader.id,
      targetId: town.id,
      resource: "wood",
      amount: 20,
      repeat: true,
    });
    run(w, 65);
    expect(trader.tradeRoute!.trips).toBeGreaterThanOrEqual(2);
    expect(getEntities(w).filter((e) => e.tradeRoute)).toHaveLength(1);
    command(w, { type: "stopMerchantRoute", actorId: trader.id });
    run(w, 30);
    expect(trader.tradeRoute!.phase).toBe("idle");
    const gold = w.resources.gold;
    run(w, 30);
    expect(w.resources.gold).toBe(gold);
  });
  it("waits for cargo and for a blocked crossing without consuming goods twice", () => {
    const { w, town, trader } = setup();
    w.resources.wood = 0;
    command(w, {
      type: "dispatchMerchant",
      actorId: trader.id,
      targetId: town.id,
      resource: "wood",
      amount: 20,
      repeat: true,
    });
    run(w, 5);
    expect(trader.tradeRoute!.phase).toBe("waiting");
    w.resources.wood = 40;
    for (const b of getEntities(w).filter((e) => e.type === "bridge"))
      b.open = false;
    run(w, 5);
    expect(w.resources.wood).toBe(40);
    expect(trader.tradeRoute!.cargo.wood).toBe(0);
    for (const b of getEntities(w).filter((e) => e.type === "bridge"))
      b.open = true;
    run(w, 4);
    expect(trader.tradeRoute!.phase).toBe("outbound");
    expect(w.resources.wood).toBe(20);
  });
  it("returns unsold goods when recalled or when war closes the destination", () => {
    for (const war of [false, true]) {
      const { w, town, trader } = setup(),
        gold = w.resources.gold;
      command(w, {
        type: "dispatchMerchant",
        actorId: trader.id,
        targetId: town.id,
        resource: "iron",
        amount: 10,
        repeat: true,
      });
      run(w, 1);
      if (war) town.relation = "hostile";
      else command(w, { type: "recallMerchant", actorId: trader.id });
      run(w, 30);
      expect(w.resources.iron).toBe(20);
      expect(w.resources.gold).toBe(gold);
      expect(trader.tradeRoute!.phase).toBe("idle");
      expect(w.addons!.progress!.tradeReturns).toBe(0);
    }
  });
  it("round trips a loaded route and rejects invalid shipments and saves", () => {
    const { w, town, trader } = setup();
    expect(
      command(w, {
        type: "dispatchMerchant",
        actorId: trader.id,
        targetId: town.id,
        resource: "wood",
        amount: -20,
        repeat: true,
      }).ok,
    ).toBe(false);
    command(w, {
      type: "dispatchMerchant",
      actorId: trader.id,
      targetId: town.id,
      resource: "stone",
      amount: 20,
      repeat: true,
    });
    run(w, 4);
    const b = validateSave(JSON.parse(JSON.stringify(w)));
    run(w, 35);
    run(b, 35);
    expect(b).toEqual(w);
    const bad = JSON.parse(JSON.stringify(w));
    bad.entities[trader.id].tradeRoute.cargo.gold = -1;
    expect(() => validateSave(bad)).toThrow("Uszkodzony zapis trasy handlowej");
  });
});
