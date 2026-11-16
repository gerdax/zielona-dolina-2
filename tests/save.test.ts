import "fake-indexeddb/auto";
import { describe, it, expect } from "vitest";
import { createWorld, command, step, getEntities } from "../src/simulation";
import { validateSave, saveWorld, loadWorld } from "../src/save";
describe("persistent campaign saves", () => {
  it("atomically retains a previous snapshot and restores mounted identities", async () => {
    const w = createWorld(),
      hero = getEntities(w).find((e) => e.kind === "hero")!,
      horse = getEntities(w).find((e) => e.kind === "horse")!;
    hero.x = horse.x;
    hero.z = horse.z + 1;
    command(w, { type: "mount", targetId: horse.id });
    await saveWorld(w);
    w.resources.gold = 222;
    await saveWorld(w);
    const restored = await loadWorld(),
      backup = await loadWorld(true);
    expect(restored?.resources.gold).toBe(222);
    expect(backup?.resources.gold).toBe(70);
    expect(restored?.entities[hero.id].mountedOn).toBe(horse.id);
    expect(restored?.entities[horse.id].carriedBy).toBe(hero.id);
    expect(restored).not.toBe(w);
  });
  it("round trips orders, bridge transitions and production through JSON", () => {
    const w = createWorld(),
      b = getEntities(w).find((e) => e.type === "bridge")!;
    command(w, { type: "toggle", targetId: b.id });
    step(w, 0.1);
    const restored = validateSave(JSON.parse(JSON.stringify(w)));
    expect(restored.entities[b.id].open).toBe(false);
    expect(restored.recruitQueue).toEqual(w.recruitQueue);
    expect(restored.resources).toEqual(w.resources);
  });
  it("rejects unsupported, corrupt and incomplete saves before replacing current game", () => {
    expect(() => validateSave({ version: 999 })).toThrow();
    const w = createWorld();
    w.resources.wood = NaN;
    expect(() => validateSave(w)).toThrow("zasoby");
    const valid = createWorld();
    getEntities(valid).find((e) => e.kind === "hero")!.carriedBy =
      "nonexistent";
    expect(() => validateSave(valid)).toThrow("transportu");
  });
});
