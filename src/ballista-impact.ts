import { buildingDefs } from "./content";
interface Entity {
  id: string;
  type: string;
  kind: string;
  x: number;
  z: number;
  originalType?: unknown;
  lastAttack?: unknown;
}
interface Attack {
  time: number;
  targetId: string;
  x: number;
  z: number;
}
export interface BoltImpact {
  x: number;
  z: number;
  y: number;
  wood: boolean;
}
/** Preserve a fired shot through shooter/target destruction, and emit only once at arrival. */
export class BallistaImpacts {
  private clock = -1;
  private shots = new Map<
    string,
    { time: number; done: boolean; impact?: BoltImpact }
  >();
  update(world: {
    time: number;
    entities: Record<string, Entity>;
  }): BoltImpact[] {
    if (world.time < this.clock) this.shots.clear();
    this.clock = world.time;
    for (const e of Object.values(world.entities)) {
      const a = e.lastAttack as Attack | undefined;
      if (
        e.type !== "ballistaTower" ||
        !a ||
        world.time - a.time > 1 ||
        this.shots.get(e.id)?.time === a.time
      )
        continue;
      const target = world.entities[a.targetId],
        type = String(target?.originalType || target?.type),
        def = buildingDefs[type];
      const structure =
        target &&
        ["building", "ruin"].includes(target.kind) &&
        ["wall", "gate"].includes(def?.behavior || type);
      const dx = a.x - e.x,
        dz = a.z - e.z,
        length = Math.hypot(dx, dz) || 1;
      this.shots.set(e.id, {
        time: a.time,
        done: false,
        impact: structure
          ? {
              x: a.x - (dx / length) * 0.52,
              z: a.z - (dz / length) * 0.52,
              y: 0.95,
              wood: def?.material === "wood",
            }
          : undefined,
      });
    }
    const impacts: BoltImpact[] = [];
    for (const [id, shot] of this.shots) {
      const age = world.time - shot.time;
      if (!shot.done && age >= 0.45) {
        shot.done = true;
        if (age <= 0.65 && shot.impact) impacts.push(shot.impact);
      }
      if (age > 1) this.shots.delete(id);
    }
    return impacts;
  }
}
