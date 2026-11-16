import { describe, it, expect } from "vitest";
import {
  type Entity,
  createWorld,
  command,
  step,
  getEntities,
  canRemoveRoad,
} from "../src/simulation";
import { validateSave } from "../src/save";
import { wallWalkingPose } from "../src/wall-navigation";
function run(w: ReturnType<typeof createWorld>, n: number) {
  for (let i = 0; i < n * 10; i++) step(w, 0.1);
}
function setup() {
  const w = createWorld(),
    hero = getEntities(w).find((e) => e.kind === "hero")!,
    model = getEntities(w).find((e) => e.kind === "building")!,
    unit = getEntities(w).find((e) => e.kind === "soldier")!;
  const posts: Entity[] = [0, 1, 2, 3].map((i) => ({
    ...model,
    id: "post" + i,
    type: i === 3 ? "stoneTower" : "wall",
    x: 10 + i,
    z: 10,
    rotation: 1,
    occupantId: undefined,
  }));
  const a = {
    ...unit,
    id: "archer",
    kind: "archer" as const,
    type: "archer",
    x: 10,
    z: 10,
    elevation: 1,
    garrisonId: "post0",
  };
  posts[0].occupantId = a.id;
  w.entities = Object.fromEntries([hero, ...posts, a].map((e) => [e.id, e]));
  w.raidTimer = 1e8;
  w.nextMerchantAt = 1e8;
  return { w, a, posts };
}
describe("walking on fortifications and removing paths", () => {
  it("crosses linked walls and a taller tower above ground using the same unit", () => {
    const { w, a, posts } = setup(),
      ids = Object.keys(w.entities);
    expect(
      command(w, { type: "garrison", actorId: a.id, targetId: posts[3].id }).ok,
    ).toBe(true);
    step(w, 0.1);
    expect(a.wallWalk).toBeDefined();
    expect(a.elevation).toBe(1);
    expect(a.x).toBeGreaterThan(10);
    expect(wallWalkingPose(a.wallWalk!, getEntities(w))!.floor).toBeGreaterThan(
      1,
    );
    run(w, 3);
    expect(a.garrisonId).toBe(posts[3].id);
    expect(a.elevation).toBe(1);
    expect(a.wallWalk).toBeUndefined();
    expect(posts[0].occupantId).toBeUndefined();
    expect(posts[3].occupantId).toBe(a.id);
    expect(Object.keys(w.entities)).toEqual(ids);
  });
  it("continues a saved crossing and redirects without resetting its current step", () => {
    const { w, a, posts } = setup();
    command(w, { type: "garrison", actorId: a.id, targetId: posts[3].id });
    step(w, 0.1);
    const progress = a.wallWalk!.progress;
    expect(
      command(w, { type: "garrison", actorId: a.id, targetId: posts[2].id }).ok,
    ).toBe(true);
    expect(a.wallWalk!.progress).toBe(progress);
    const b = validateSave(JSON.parse(JSON.stringify(w)));
    run(w, 3);
    run(b, 3);
    expect(b).toEqual(w);
    expect(a.garrisonId).toBe(posts[2].id);
  });
  it("waits for another archer and never steals the occupied post", () => {
    const { w, a, posts } = setup();
    const other = { ...a, id: "other", x: 11, garrisonId: "post1" };
    w.entities.other = other;
    posts[1].occupantId = other.id;
    command(w, { type: "garrison", actorId: a.id, targetId: posts[3].id });
    run(w, 0.5);
    expect(a.x).toBe(10);
    expect(posts[1].occupantId).toBe(other.id);
    expect(command(w, { type: "ungarrison", actorId: other.id }).ok).toBe(true);
    run(w, 5);
    expect(a.garrisonId).toBe(posts[3].id);
    expect(a.elevation).toBe(1);
  });
  it("rejects gaps and blocks demolition of a post used by a crossing", () => {
    const { w, a, posts } = setup();
    command(w, { type: "garrison", actorId: a.id, targetId: posts[3].id });
    step(w, 0.1);
    expect(command(w, { type: "demolish", targetId: posts[1].id }).ok).toBe(
      false,
    );
    expect(w.entities[posts[1].id]).toBeDefined();
    const next = setup();
    delete next.w.entities.post1;
    expect(
      command(next.w, {
        type: "garrison",
        actorId: next.a.id,
        targetId: "post3",
      }).ok,
    ).toBe(false);
    expect(next.a.garrisonId).toBe("post0");
  });
  it("stops on the next deck instead of dropping to the ground", () => {
    const { w, a } = setup();
    command(w, { type: "garrison", actorId: a.id, targetId: "post3" });
    step(w, 0.1);
    command(w, { type: "stop", ids: [a.id] });
    run(w, 2);
    expect(a.garrisonId).toBe("post1");
    expect(a.elevation).toBe(1);
    expect(a.wallWalk).toBeUndefined();
    expect(w.entities.post3.occupantId).toBeUndefined();
  });
  it("removes initial paths permanently without a resource refund", () => {
    const w = createWorld(),
      before = { ...w.resources },
      count = getEntities(w).length;
    expect(canRemoveRoad(w, 16, 25).ok).toBe(true);
    expect(command(w, { type: "removeRoad", x: 16, z: 25 }).ok).toBe(true);
    expect(w.removedRoads).toContain("16,25");
    expect(w.resources).toEqual(before);
    expect(getEntities(w)).toHaveLength(count);
    expect(command(w, { type: "removeRoad", x: 16, z: 25 }).ok).toBe(false);
    const b = validateSave(JSON.parse(JSON.stringify(w)));
    expect(canRemoveRoad(b, 16, 25).ok).toBe(false);
  });
  it("removes constructed roads once and never removes an unrelated building", () => {
    const w = createWorld();
    expect(
      command(w, { type: "build", building: "road", x: 20, z: 34 }).ok,
    ).toBe(true);
    const road = getEntities(w).find(
      (e) => e.type === "road" && e.x === 20 && e.z === 34,
    )!;
    expect(command(w, { type: "removeRoad", x: 20, z: 34 }).ok).toBe(true);
    expect(w.entities[road.id]).toBeUndefined();
    const wood = w.resources.wood;
    expect(command(w, { type: "removeRoad", x: 20, z: 34 }).ok).toBe(false);
    expect(w.resources.wood).toBe(wood);
    expect(command(w, { type: "removeRoad", x: 14, z: 30 }).ok).toBe(true);
    expect(getEntities(w).some((e) => e.type === "hall")).toBe(true);
  });
});
