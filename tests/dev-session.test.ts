import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWorld, getEntities } from "../src/simulation";
import { recoverSession, retainSession } from "../src/dev-session";
describe("development reload continuity", () => {
  let memory: Map<string, string>;
  beforeEach(() => {
    memory = new Map();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => memory.set(key, value),
      removeItem: (key: string) => memory.delete(key),
    });
  });
  afterEach(() => vi.unstubAllGlobals());
  it("restores the same campaign, selected units and camera once after a reload", () => {
    const world = createWorld(),
      h = getEntities(world).find((e) => e.kind === "hero")!;
    world.resources.gold = 147;
    retainSession("campaign", {
      world,
      selected: [h.id],
      playing: true,
      camera: { x: 27, z: 38, zoom: 18 },
    });
    world.resources.gold = 0;
    const restored = recoverSession("campaign");
    expect(restored?.world.resources.gold).toBe(147);
    expect(restored?.selected).toEqual([h.id]);
    expect(restored?.camera).toEqual({ x: 27, z: 38, zoom: 18 });
    expect(restored?.playing).toBe(true);
    expect(memory.has("campaign:recovery-copy")).toBe(true);
    expect(recoverSession("campaign")).toBeNull();
  });
  it("ignores corrupt data rather than preventing startup", () => {
    memory.set("campaign", "{invalid");
    expect(recoverSession("campaign")).toBeNull();
    expect(memory.get("campaign")).toBe("{invalid");
    memory.set("campaign", JSON.stringify({ world: { version: 99 } }));
    expect(recoverSession("campaign")).toBeNull();
  });
  it("does not break a session when storage is unavailable", () => {
    vi.stubGlobal("sessionStorage", {
      getItem: () => {
        throw Error("blocked");
      },
      setItem: () => {
        throw Error("full");
      },
    });
    expect(() =>
      retainSession("campaign", {
        world: createWorld(),
        selected: [],
        playing: true,
        camera: { x: 20, z: 30, zoom: 24 },
      }),
    ).not.toThrow();
    expect(recoverSession("campaign")).toBeNull();
  });
});
