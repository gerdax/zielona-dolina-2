import { describe, it, expect } from "vitest";
import {
  createWorld,
  step,
  getEntities,
  command,
  merchantTradeAvailable,
} from "../src/simulation";
import { validateSave } from "../src/save";
function run(w: ReturnType<typeof createWorld>, seconds: number) {
  for (let i = 0; i < seconds * 10; i++) step(w, 0.1);
}
function visiting() {
  const w = createWorld();
  run(w, 30);
  const e = getEntities(w).find((e) => e.type === "merchant")!;
  expect(e?.merchant?.phase).toBe("trading");
  return { w, e };
}
describe("visiting merchants", () => {
  it("arrives as a real cart, leaves and returns as a new visitor without duplicates", () => {
    const w = createWorld();
    step(w, 0.1);
    const first = getEntities(w).find((e) => e.type === "merchant")!;
    expect(first.merchant?.phase).toBe("arriving");
    expect(first.order?.path?.length).toBeGreaterThan(0);
    run(w, 30);
    expect(first.merchant?.phase).toBe("trading");
    run(w, 160);
    expect(w.entities[first.id]).toBeUndefined();
    run(w, 70);
    expect(getEntities(w).filter((e) => e.type === "merchant")).toHaveLength(1);
    expect(w.merchantVisits).toBe(2);
  });
  it("conserves goods and coins on both sides of buy and sell", () => {
    const { w, e } = visiting();
    const goods = w.resources.wood + e.merchant!.stock.wood,
      coins = w.resources.gold + e.merchant!.stock.gold;
    const gold = w.resources.gold;
    expect(
      command(w, {
        type: "merchantTrade",
        targetId: e.id,
        resource: "wood",
        side: "buy",
      }).ok,
    ).toBe(true);
    expect(w.resources.gold).toBe(gold - 8);
    expect(w.resources.wood + e.merchant!.stock.wood).toBe(goods);
    expect(w.resources.gold + e.merchant!.stock.gold).toBe(coins);
    expect(
      command(w, {
        type: "merchantTrade",
        targetId: e.id,
        resource: "wood",
        side: "sell",
      }).ok,
    ).toBe(true);
    expect(w.resources.gold).toBe(gold - 4);
    expect(w.resources.wood + e.merchant!.stock.wood).toBe(goods);
    expect(w.resources.gold + e.merchant!.stock.gold).toBe(coins);
  });
  it("rejects insufficient money, stock, cargo room and trading after departure", () => {
    const { w, e } = visiting();
    w.resources.gold = 0;
    expect(
      command(w, {
        type: "merchantTrade",
        targetId: e.id,
        resource: "iron",
        side: "buy",
      }).ok,
    ).toBe(false);
    w.resources.gold = 100;
    e.merchant!.stock.iron = 0;
    expect(
      command(w, {
        type: "merchantTrade",
        targetId: e.id,
        resource: "iron",
        side: "buy",
      }).ok,
    ).toBe(false);
    w.resources.wood = 700;
    expect(merchantTradeAvailable(w, e, "wood", "buy").message).toBe(
      "Brak miejsca w magazynach",
    );
    e.merchant!.stock.gold = 0;
    expect(
      command(w, {
        type: "merchantTrade",
        targetId: e.id,
        resource: "wood",
        side: "sell",
      }).ok,
    ).toBe(false);
    e.merchant!.until = w.time;
    expect(
      command(w, {
        type: "merchantTrade",
        targetId: e.id,
        resource: "wood",
        side: "sell",
      }).ok,
    ).toBe(false);
  });
  it("migrates the initial caravan representation without losing the campaign", () => {
    const { w, e } = visiting();
    const old = JSON.parse(JSON.stringify(w));
    old.entities[e.id].kind = "caravan";
    const recovered = validateSave(old);
    expect(recovered.entities[e.id].kind).toBe("merchant");
    expect(recovered.resources).toEqual(w.resources);
    expect(Object.keys(recovered.entities)).toEqual(Object.keys(w.entities));
  });
  it("restores inventory, route and visit timer and rejects corrupt merchant saves", () => {
    const { w, e } = visiting();
    command(w, {
      type: "merchantTrade",
      targetId: e.id,
      resource: "iron",
      side: "buy",
    });
    const loaded = validateSave(JSON.parse(JSON.stringify(w)));
    expect(loaded.entities[e.id].merchant).toEqual(e.merchant);
    run(w, 10);
    run(loaded, 10);
    expect(loaded).toEqual(w);
    const bad = JSON.parse(JSON.stringify(w));
    bad.entities[e.id].merchant.stock.gold = -1;
    expect(() => validateSave(bad)).toThrow("Uszkodzony zapis kupca");
  });
});
