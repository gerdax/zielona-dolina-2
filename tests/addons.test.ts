import { describe, it, expect } from "vitest";
import {
  createWorld,
  createNextExpedition,
  applyStarterBonuses,
  command,
  getEntities,
} from "../src/simulation";
import { addonsFor, collectGems, collectTaskGems } from "../src/addons";
import { validateSave } from "../src/save";

describe("gems and original-game addons", () => {
  it("awards ten per defeated camp or conquered town once, with no gems for peaceful alliances", () => {
    const w = createWorld(),
      a = addonsFor(w),
      town = getEntities(w).find((e) => e.kind === "town")!;
    expect(collectGems(w)).toBe(0);
    town.relation = "allied";
    expect(collectGems(w)).toBe(0);
    w.objectives.banditsDefeated = true;
    expect(collectGems(w)).toBe(10);
    expect(collectGems(w)).toBe(0);
    town.relation = "conquered";
    expect(collectGems(w)).toBe(10);
    expect(a.gems).toBe(20);
    expect(collectTaskGems(w)).toBe(10);
    const b = validateSave(JSON.parse(JSON.stringify(w)));
    expect(collectGems(b)).toBe(0);
    expect(addonsFor(b).gems).toBe(30);
  });
  it("uses original pack prices and never grants a purchased bonus to the current settlement", () => {
    const w = createWorld(),
      a = addonsFor(w),
      entities = JSON.stringify(w.entities),
      resources = { ...w.resources };
    a.gems = 49;
    expect(command(w, { type: "buyAddon", addonId: "soldiers" }).ok).toBe(
      false,
    );
    expect(a.gems).toBe(49);
    a.gems = 450;
    expect(command(w, { type: "buyAddon", addonId: "soldiers" }).ok).toBe(true);
    expect(a.gems).toBe(400);
    expect(command(w, { type: "buyAddon", addonId: "soldiers" }).ok).toBe(
      false,
    );
    expect(a.gems).toBe(400);
    expect(command(w, { type: "buyAddon", addonId: "village" }).ok).toBe(true);
    expect(a.gems).toBe(0);
    expect(JSON.stringify(w.entities)).toBe(entities);
    expect(w.resources).toEqual(resources);
    expect(applyStarterBonuses(w)).toBe(false);
    expect(JSON.stringify(w.entities)).toBe(entities);
  });
  it("carries purchases, wallet and appearance to a new world with the exact bonuses applied once", () => {
    const old = createWorld(),
      a = addonsFor(old);
    a.gems = 700;
    command(old, { type: "buyAddon", addonId: "soldiers" });
    command(old, { type: "buyAddon", addonId: "village" });
    command(old, {
      type: "appearance",
      appearanceField: "dogName",
      appearanceValue: "Burek",
    });
    const previous = JSON.stringify(old),
      base = createWorld(),
      next = createNextExpedition(old);
    const count = (w: typeof old, type: string) =>
      getEntities(w).filter((e) => e.type === type).length;
    expect(addonsFor(next).gems).toBe(250);
    expect(addonsFor(next).packs).toEqual({ soldiers: true, village: true });
    expect(count(next, "house")).toBe(count(base, "house") + 3);
    expect(count(next, "lumber")).toBe(count(base, "lumber") + 1);
    expect(count(next, "quarry")).toBe(count(base, "quarry") + 1);
    expect(count(next, "farm")).toBe(count(base, "farm") + 1);
    expect(count(next, "field")).toBe(2);
    expect(getEntities(next).filter((e) => e.kind === "soldier").length).toBe(
      getEntities(base).filter((e) => e.kind === "soldier").length + 3,
    );
    expect(getEntities(next).filter((e) => e.kind === "worker").length).toBe(
      getEntities(base).filter((e) => e.kind === "worker").length + 6,
    );
    expect(getEntities(next).find((e) => e.kind === "dog")!.label).toBe(
      "Burek",
    );
    expect(JSON.stringify(old)).toBe(previous);
    const size = getEntities(next).length;
    expect(applyStarterBonuses(next)).toBe(false);
    expect(getEntities(next)).toHaveLength(size);
  });
  it("saves cosmetic changes without changing combat stats or accepting invalid options", () => {
    const w = createWorld(),
      hero = getEntities(w).find((e) => e.kind === "hero")!,
      hp = hero.hp;
    for (const [field, value] of [
      ["outfit", "knight"],
      ["dogColor", "black"],
      ["bannerColor", "blue"],
      ["bannerEmblem", "tree"],
    ] as const)
      expect(
        command(w, {
          type: "appearance",
          appearanceField: field,
          appearanceValue: value,
        }).ok,
      ).toBe(true);
    expect(
      command(w, {
        type: "appearance",
        appearanceField: "dogName",
        appearanceValue: "  Azor  ",
      }).ok,
    ).toBe(true);
    expect(
      command(w, {
        type: "appearance",
        appearanceField: "outfit",
        appearanceValue: "invalid",
      }).ok,
    ).toBe(false);
    expect(
      command(w, {
        type: "appearance",
        appearanceField: "dogName",
        appearanceValue: "  ",
      }).ok,
    ).toBe(false);
    expect(hero.hp).toBe(hp);
    const b = validateSave(JSON.parse(JSON.stringify(w)));
    expect(b.addons).toEqual(w.addons);
  });
  it("keeps meta addons available after defeat without enabling gameplay commands", () => {
    const w = createWorld();
    w.defeated = true;
    addonsFor(w).gems = 50;
    expect(command(w, { type: "buyAddon", addonId: "soldiers" }).ok).toBe(true);
    expect(
      command(w, {
        type: "appearance",
        appearanceField: "outfit",
        appearanceValue: "scout",
      }).ok,
    ).toBe(true);
    expect(
      command(w, { type: "build", building: "house", x: 20, z: 34 }).ok,
    ).toBe(false);
  });
  it("migrates old campaigns and historical conquest rewards without duplicate gems", () => {
    const old = createWorld();
    delete old.addons;
    getEntities(old).find((e) => e.kind === "town")!.relation = "conquered";
    const recovered = validateSave(JSON.parse(JSON.stringify(old)));
    expect(addonsFor(recovered).gems).toBe(20);
    expect(
      validateSave(JSON.parse(JSON.stringify(recovered))).addons!.gems,
    ).toBe(20);
    const bad = JSON.parse(JSON.stringify(recovered));
    bad.addons.gems = -1;
    expect(() => validateSave(bad)).toThrow("Uszkodzony zapis klejnotów");
  });
});
