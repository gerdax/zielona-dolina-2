import { BallistaImpacts } from "./ballista-impact";
import { turnBallista } from "./ballista-motion";
import { defenseModel } from "./defense-models";
import { expansionModel } from "./expansion-models";
import { damageStage, collapsePose } from "./fortification-damage";
import {
  impactParticles,
  impactPose,
  type ImpactParticle,
} from "./impact-particles";
import { siegePose } from "./siege-animation";
import {
  boatHeading,
  boatHeight,
  turnBoat,
  BOAT_FLOOR_HEIGHT,
} from "./boat-motion";
import {
  isWallPost,
  wallConnected,
  wallStandingPose,
  wallWalkingPose,
  type WallPost,
  type WallWalk,
} from "./wall-navigation";
import { villageRoadTiles, roadKey } from "./village-roads";
import { fortificationSurface, supportedPose } from "./fortification-support";
import { outfits, dogCoats, bannerColors, type Appearance } from "./addons";
import type { Entity } from "./simulation";
import { footprint, touching } from "./construction";
import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { buildingDefs } from "./content";
import { connectedBridgeGroup } from "./bridge-groups";

export interface VisualEntity {
  id: string;
  kind: string;
  type: string;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  faction: string;
  rotation?: number;
  links?: string[];
  [key: string]: unknown;
}
export interface VisualWorld {
  size: number;
  entities: Record<string, VisualEntity>;
  time: number;
  [key: string]: unknown;
}
const materials = new Map<string, T.MeshStandardMaterial>();
function mat(color: string, roughness = 0.9) {
  const key = color + roughness;
  if (!materials.has(key))
    materials.set(key, new T.MeshStandardMaterial({ color, roughness }));
  return materials.get(key)!;
}
const palette = {
  wood: "#785338",
  beam: "#493b2b",
  plaster: "#e2d2a1",
  roof: "#536f75",
  red: "#8e4d38",
  gold: "#d9b873",
  stone: "#93978c",
  leaf: "#49734d",
};
function mesh(
  g: T.BufferGeometry,
  c: string,
  parent: T.Object3D,
  x = 0,
  y = 0,
  z = 0,
) {
  const m = new T.Mesh(g, mat(c));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function box(
  p: T.Object3D,
  c: string,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
) {
  return mesh(new T.BoxGeometry(w, h, d), c, p, x, y, z);
}
function cyl(
  p: T.Object3D,
  c: string,
  x: number,
  y: number,
  z: number,
  r: number,
  h: number,
  s = 8,
  r2 = r,
) {
  return mesh(new T.CylinderGeometry(r2, r, h, s), c, p, x, y, z);
}
function sphere(
  p: T.Object3D,
  c: string,
  x: number,
  y: number,
  z: number,
  r: number,
  sx = 1,
  sy = 1,
  sz = 1,
) {
  const m = mesh(new T.IcosahedronGeometry(r, 1), c, p, x, y, z);
  m.scale.set(sx, sy, sz);
  return m;
}
function roof(
  p: T.Object3D,
  w: number,
  d: number,
  y: number,
  c = palette.roof,
  rise = w * 0.65,
) {
  // Separate planar slopes and a visible ridge avoid the bowl-like shading
  // of a low, smooth four-sided cone from the isometric camera.
  const base = y - w * 0.22;
  const a = [-w * 0.56, base, d * 0.56];
  const b = [w * 0.56, base, d * 0.56];
  const cc = [w * 0.56, base, -d * 0.56];
  const dd = [-w * 0.56, base, -d * 0.56];
  const left = [-w * 0.22, base + rise, 0];
  const right = [w * 0.22, base + rise, 0];
  const geometry = new T.BufferGeometry();
  geometry.setAttribute(
    "position",
    new T.Float32BufferAttribute(
      [
        ...a,
        ...b,
        ...right,
        ...a,
        ...right,
        ...left,
        ...cc,
        ...dd,
        ...left,
        ...cc,
        ...left,
        ...right,
        ...b,
        ...cc,
        ...right,
        ...dd,
        ...a,
        ...left,
      ],
      3,
    ),
  );
  geometry.computeVertexNormals();
  const top = mesh(geometry, c, p);
  box(p, palette.beam, 0, base, 0, w * 1.14, 0.09, d * 1.14);
  box(p, palette.beam, 0, base + rise, 0, w * 0.49, 0.065, 0.075);
  return top;
}
function flag(p: T.Object3D, x: number, y: number, z: number, c: string) {
  cyl(p, palette.beam, x, y, z, 0.028, 1.5, 5);
  const f = box(p, c, x + 0.23, y + 0.5, z, 0.48, 0.32, 0.025);
  f.userData.flag = true;
  return f;
}
function windowBox(p: T.Object3D, x: number, y: number, z: number) {
  box(p, palette.beam, x, y, z, 0.25, 0.38, 0.05);
  box(p, "#d6af5f", x, y, z + 0.03, 0.13, 0.25, 0.015);
}
/** A compact harbor house, fixed landing and exposed hand winch. */
function harbor() {
  const g = new T.Group();
  const iron = "#525f5b",
    rope = "#e2c78c",
    timber = "#987043";
  box(g, palette.stone, -0.2, 0.08, 0, 1.9, 0.16, 1.75);
  box(g, "#d8cca1", -0.2, 0.75, 0, 1.6, 1.35, 1.4);
  for (const x of [-1, 0.6])
    for (const z of [-0.7, 0.7])
      box(g, palette.beam, x, 0.78, z, 0.1, 1.45, 0.1);
  roofAt(g, 1.7, 1.55, 1.85, -0.2, 0, "#416c70");
  box(g, palette.beam, -0.55, 0.54, 0.72, 0.44, 0.92, 0.07);
  windowBox(g, 0.13, 0.94, 0.72);
  // Cream anchor sign contrasts with the blue harbor roof.
  box(g, "#315c62", -0.25, 1.27, 0.79, 0.58, 0.5, 0.07);
  const anchor = new T.Group();
  anchor.position.set(-0.25, 1.27, 0.84);
  g.add(anchor);
  cyl(anchor, rope, 0, 0, 0, 0.022, 0.3, 6);
  box(anchor, rope, 0, 0.055, 0, 0.23, 0.035, 0.035);
  for (const side of [-1, 1]) {
    const arm = box(anchor, rope, side * 0.075, -0.095, 0, 0.17, 0.035, 0.035);
    arm.rotation.z = side * 0.6;
  }
  mesh(new T.TorusGeometry(0.045, 0.014, 5, 10), rope, anchor, 0, 0.18, 0);
  // Landing is visibly attached to the house; the near edge remains open for boarding.
  for (let i = 0; i < 11; i++)
    box(
      g,
      i % 3 ? timber : "#ae8350",
      0.85 + i * 0.24,
      0.13,
      0,
      0.225,
      0.15,
      1.5,
    );
  for (const x of [0.85, 2.05, 3.3])
    for (const z of [-0.67, 0.67]) {
      cyl(g, palette.beam, x, -0.18, z, 0.085, 1.0, 7);
      cyl(g, palette.beam, x, 0.32, z, 0.075, 0.38, 7);
      cyl(g, rope, x, 0.42, z, 0.082, 0.035, 7);
    }
  box(g, palette.beam, 2.07, 0.49, -0.7, 2.6, 0.07, 0.07);
  // Two trestles hold a horizontal, clearly exposed rope drum.
  for (const x of [1.62, 2.4]) {
    box(g, timber, x, 0.45, -0.25, 0.12, 0.52, 0.2);
    box(g, iron, x, 0.22, -0.25, 0.26, 0.06, 0.36);
  }
  const drum = cyl(g, rope, 2.01, 0.66, -0.25, 0.18, 0.65, 12);
  drum.rotation.z = Math.PI / 2;
  for (const x of [1.65, 2.37]) {
    const rim = cyl(g, iron, x, 0.66, -0.25, 0.25, 0.06, 12);
    rim.rotation.z = Math.PI / 2;
  }
  for (let i = 0; i < 9; i++) {
    const winding = mesh(
      new T.TorusGeometry(0.185, 0.012, 5, 16),
      "#b3935d",
      g,
      1.73 + i * 0.07,
      0.66,
      -0.25,
    );
    winding.rotation.y = Math.PI / 2;
  }
  const axle = cyl(g, iron, 2.51, 0.66, -0.25, 0.035, 0.24, 6);
  axle.rotation.z = Math.PI / 2;
  box(g, iron, 2.63, 0.81, -0.25, 0.045, 0.33, 0.05);
  const handle = cyl(g, timber, 2.72, 0.96, -0.25, 0.045, 0.2, 7);
  handle.rotation.z = Math.PI / 2;
  // A tall jib, pale line and hanging hook make the lifting function legible.
  box(g, timber, 1.68, 0.98, -0.52, 0.12, 1.6, 0.12);
  box(g, timber, 1.68, 1.72, 0.18, 0.12, 0.14, 1.55);
  const brace = box(g, palette.beam, 1.68, 1.42, -0.12, 0.09, 0.09, 1.0);
  brace.rotation.x = -0.55;
  cyl(g, rope, 1.68, 1.18, 0.9, 0.019, 1.0, 6);
  const pulley = cyl(g, iron, 1.68, 1.66, 0.9, 0.1, 0.06, 10);
  pulley.rotation.z = Math.PI / 2;
  const hook = mesh(
    new T.TorusGeometry(0.095, 0.025, 6, 12, Math.PI * 1.65),
    iron,
    g,
    1.68,
    0.61,
    0.9,
  );
  hook.rotation.z = 0.3;
  // Small fenders mark the berth, separate from the machinery.
  for (const x of [1.15, 3.1]) {
    cyl(g, rope, x, 0.2, 0.79, 0.014, 0.5, 5);
    cyl(g, "#e3d9b5", x, -0.02, 0.79, 0.09, 0.27, 8);
    cyl(g, "#ab634b", x, -0.02, 0.79, 0.094, 0.08, 8);
  }
  return g;
}

function building(e: VisualEntity) {
  const expansion = defenseModel(e.type) || expansionModel(e.type);
  if (expansion) {
    if (e.type === "wallStairs")
      expansion.scale.y = Number(e.stairsHeight || 1.3) / 1.21;
    return expansion;
  }
  if (["dock", "port"].includes(e.type)) return harbor();
  const def = buildingDefs[e.type];
  const g = new T.Group(),
    type =
      def?.behavior ||
      (
        {
          tradingPost: "market",
          forester: "lumber",
          armory: "barracks",
          siegeWorkshop: "barracks",
          camelYard: "stable",
          goldMine: "mine",
        } as Record<string, string>
      )[e.type] ||
      e.type;
  const color = e.faction === "neutral" ? "#8c5550" : palette.roof;
  if (["trench", "canal", "ravine"].includes(type)) {
    // The bed must stay below the water surface (-.04 in world space).
    box(g, "#493e2a", 0, 0.015, 0, 1, 0.02, 1);
    const edges = Number(e.channelEdges ?? 15);
    for (const [bit, x, z, w, d] of [
      [1, -0.47, 0, 0.06, 1],
      [2, 0.47, 0, 0.06, 1],
      [4, 0, -0.47, 1, 0.06],
      [8, 0, 0.47, 1, 0.06],
    ])
      if (edges & bit) box(g, "#897b52", x, 0.045, z, w, 0.04, d);
    return g;
  }
  if (type === "well") {
    cyl(g, palette.stone, 0, 0.3, 0, 0.45, 0.6, 10);
    cyl(g, "#3c655e", 0, 0.61, 0, 0.32, 0.015, 12);
    for (const x of [-0.5, 0.5])
      box(g, palette.wood, x, 0.9, 0, 0.08, 1.8, 0.08);
    roof(g, 1.3, 1, 1.85);
    box(g, palette.beam, 0, 1.25, 0, 1.1, 0.08, 0.08);
    box(g, "#b9a979", 0, 1, 0, 0.02, 0.5, 0.02);
    cyl(g, palette.wood, 0, 0.7, 0, 0.13, 0.25, 8);
    return g;
  }
  if (type === "field") {
    box(g, "#79613f", 0, 0.02, 0, 1.5, 0.035, 1.5);
    for (let x = 0; x < 5; x++)
      for (let z = 0; z < 5; z++) {
        const px = -0.6 + x * 0.3,
          pz = -0.6 + z * 0.3;
        cyl(g, "#9ea355", px, 0.2, pz, 0.018, 0.36, 4);
        sphere(g, "#d4c37a", px, 0.38, pz, 0.055, 0.65, 1.6, 0.65);
      }
    return g;
  }
  if (
    ["lantern", "torch", "campfire", "bench", "signpost", "banner"].includes(
      type,
    )
  ) {
    if (type === "bench") {
      for (const x of [-0.45, 0.45])
        box(g, palette.beam, x, 0.22, 0, 0.09, 0.44, 0.42);
      box(g, palette.wood, 0, 0.46, 0, 1.2, 0.1, 0.5);
      box(g, palette.wood, 0, 0.75, -0.24, 1.2, 0.32, 0.05);
    }
    if (type === "signpost") {
      box(g, palette.wood, 0, 0.7, 0, 0.09, 1.4, 0.09);
      box(g, "#b79c62", 0.1, 1.2, 0, 0.8, 0.22, 0.09);
      box(g, palette.wood, -0.1, 0.9, 0, 0.65, 0.19, 0.09);
    }
    if (type === "banner") flag(g, 0, 1, 0, "#d5b574");
    if (def?.lightRadius) {
      const fireY = type === "campfire" ? 0.15 : type === "torch" ? 0.9 : 1.5;
      if (type === "campfire") {
        for (let i = 0; i < 6; i++)
          sphere(
            g,
            palette.stone,
            Math.sin(i) * 0.3,
            0.08,
            Math.cos(i) * 0.3,
            0.1,
          );
        const log = box(g, palette.wood, 0, 0.1, 0, 0.65, 0.12, 0.12);
        log.rotation.y = 0.5;
      } else box(g, palette.beam, 0, fireY / 2, 0, 0.08, fireY, 0.08);
      const glow = mesh(
        new T.SphereGeometry(type === "lantern" ? 0.12 : 0.1, 6, 5),
        "#f3c367",
        g,
        0,
        fireY,
        0,
      );
      glow.material = new T.MeshStandardMaterial({
        color: "#ffe3a0",
        emissive: "#f5ac3f",
        emissiveIntensity: 1.5,
      });
      const light = new T.PointLight("#ffcb81", 1.5, def.lightRadius, 2);
      light.position.set(0, fireY, 0);
      g.add(light);
      if (type === "lantern") {
        box(g, palette.beam, 0, fireY + 0.16, 0, 0.3, 0.06, 0.3);
        box(g, palette.beam, 0, fireY - 0.16, 0, 0.3, 0.06, 0.3);
      }
    }
    return g;
  }
  if (type === "mine") {
    const ore = e.type === "goldMine" ? "#d2b566" : "#8c9d9e",
      iron = "#58665f";
    // The rock mass frames an actual clear opening; no boulders in front of it.
    for (const side of [-1, 1]) {
      box(
        g,
        side < 0 ? "#939c8b" : "#7b897c",
        side * 0.78,
        0.64,
        -0.05,
        0.5,
        1.28,
        1.15,
      );
      sphere(g, "#9ca590", side * 0.94, 0.42, -0.35, 0.38, 0.8, 1.25, 1.1);
      sphere(g, "#879582", side * 0.83, 1.12, -0.3, 0.35, 1, 1, 0.9);
    }
    box(g, "#919c8b", 0, 1.47, -0.22, 1.72, 0.43, 1.0);
    sphere(g, "#a8b09a", -0.35, 1.68, -0.4, 0.4, 1.5, 0.55, 1);
    box(g, "#17251f", 0, 0.65, 0.32, 1.08, 1.2, 0.04);
    for (const x of [-0.43, 0.43])
      box(g, "#574936", x, 0.63, 0.42, 0.08, 1.15, 0.09);
    box(g, "#574936", 0, 1.2, 0.42, 0.94, 0.09, 0.09);
    for (const x of [-0.55, 0.55]) {
      box(g, "#8d623c", x, 0.7, 0.71, 0.17, 1.4, 0.19);
      box(g, "#c19a62", x, 0.72, 0.82, 0.035, 1.3, 0.025);
      box(g, iron, x, 0.2, 0.82, 0.2, 0.065, 0.025);
      box(g, iron, x, 1.13, 0.82, 0.2, 0.065, 0.025);
      const brace = box(g, "#b28951", x * 0.73, 1.11, 0.75, 0.09, 0.46, 0.12);
      brace.rotation.z = x < 0 ? -0.65 : 0.65;
    }
    box(g, "#ad8050", 0, 1.43, 0.72, 1.42, 0.18, 0.24);
    box(g, "#5b4932", 0, 1.64, 0.65, 0.61, 0.25, 0.07);
    for (const side of [-1, 1]) {
      const handle = box(
        g,
        "#d3b27b",
        side * 0.02,
        1.64,
        0.71,
        0.035,
        0.23,
        0.025,
      );
      handle.rotation.z = side * 0.7;
      const head = box(g, ore, side * 0.075, 1.7, 0.73, 0.2, 0.04, 0.035);
      head.rotation.z = side * 0.7;
    }
    // A warm mine lantern separates the entrance from the grey cliff.
    box(g, iron, 0.78, 1.2, 0.86, 0.22, 0.04, 0.22);
    box(g, iron, 0.78, 0.92, 0.86, 0.22, 0.04, 0.22);
    const light = box(g, "#f2c278", 0.78, 1.06, 0.86, 0.13, 0.22, 0.13);
    light.material.emissive.set("#f2c278");
    light.material.emissiveIntensity = 0.7;
    for (const x of [0.69, 0.87])
      box(g, iron, x, 1.06, 0.94, 0.025, 0.28, 0.025);
    // Short rails lead visibly out of the portal to a loaded mine cart.
    for (let i = 0; i < 6; i++)
      box(g, "#6b5337", 0, 0.03, 0.65 + i * 0.29, 1.1, 0.06, 0.12);
    for (const x of [-0.45, 0.45])
      box(g, iron, x, 0.075, 1.32, 0.045, 0.055, 1.85);
    box(g, "#5a4b35", 0, 0.28, 1.63, 0.86, 0.12, 0.92);
    for (const x of [-0.45, 0.45])
      for (const z of [1.31, 1.95]) {
        const wheel = cyl(g, iron, x, 0.26, z, 0.16, 0.07, 10);
        wheel.rotation.z = Math.PI / 2;
        const hub = cyl(g, "#a6afa1", x, 0.26, z, 0.045, 0.09, 8);
        hub.rotation.z = Math.PI / 2;
      }
    for (const x of [-0.38, 0.38]) {
      const side = box(g, "#9c7446", x, 0.51, 1.63, 0.075, 0.4, 0.91);
      side.rotation.z = x < 0 ? -0.12 : 0.12;
      for (const z of [1.31, 1.95]) box(g, iron, x, 0.51, z, 0.083, 0.43, 0.05);
    }
    for (const z of [1.19, 2.07])
      box(g, "#af8851", 0, 0.51, z, 0.82, 0.4, 0.07);
    for (const z of [1.15, 2.11]) box(g, iron, 0, 0.68, z, 0.87, 0.04, 0.04);
    for (let i = 0; i < 8; i++)
      sphere(
        g,
        i % 2 ? ore : "#657c79",
        -0.23 + (i % 3) * 0.23,
        0.61 + Math.floor(i / 3) * 0.055,
        1.34 + Math.floor(i / 3) * 0.27,
        0.14,
        1,
        0.8,
        1,
      );
    return g;
  }
  if (type === "livestock" || e.type === "camelYard") {
    for (const z of [-1.2, 1.2]) {
      box(g, palette.wood, 0, 0.35, z, 2.5, 0.07, 0.07);
      for (const x of [-1.2, 0, 1.2])
        box(g, palette.beam, x, 0.25, z, 0.07, 0.5, 0.07);
    }
    for (const x of [-1.2, 1.2])
      box(g, palette.wood, x, 0.35, 0, 0.07, 0.07, 2.5);
    box(g, palette.wood, -0.6, 0.45, -0.7, 0.9, 0.9, 0.7);
    roofAt(g, 1.2, 0.9, 1.2, -0.6, -0.7, palette.red);
    if (type === "livestock")
      for (let i = 0; i < 3; i++) {
        sphere(g, "#d9d8be", -0.55 + i * 0.6, 0.36, 0.3, 0.22, 1, 1, 1.5);
        sphere(g, "#6b6550", -0.55 + i * 0.6, 0.36, 0.6, 0.1);
        for (const x of [-0.1, 0.1])
          for (const z of [-0.13, 0.13])
            box(
              g,
              "#605a45",
              -0.55 + i * 0.6 + x,
              0.12,
              0.3 + z,
              0.04,
              0.24,
              0.04,
            );
      }
    return g;
  }
  if (type === "road") {
    box(g, "#a99a76", 0, 0.025, 0, 1.01, 0.05, 1.01);
    return g;
  }
  if (type === "bridge") {
    const span = Number(e.span ?? 1);
    if (span === 0) return g;
    if (def?.material !== "stone")
      for (const x of [0, span - 1])
        for (const z of [-0.72, 0.72]) {
          cyl(g, palette.beam, x, 0.65, z, 0.11, 1.5);
          box(g, palette.stone, x, -0.03, z, 0.35, 0.2, 0.35);
        }
    if (def?.material === "stone") {
      // Masonry crossing: continuous stone slab, piers and parapets.
      box(g, palette.stone, (span - 1) / 2, 0.075, 0, span, 0.22, 1.3);
      for (const z of [-0.6, 0.6]) {
        box(g, "#a2a58c", (span - 1) / 2, 0.38, z, span, 0.4, 0.16);
        box(g, "#c1c1a6", (span - 1) / 2, 0.6, z, span + 0.04, 0.08, 0.22);
      }
      for (let x = 0; x < span; x++) {
        for (const z of [-0.47, 0.47])
          box(g, "#858c78", x, -0.24, z, 0.3, 0.6, 0.3);
        for (const z of [-0.7, 0.7]) {
          box(g, "#747d6a", x - 0.48, 0.38, z, 0.02, 0.32, 0.012);
          box(g, "#747d6a", x, 0.4, z, 0.96, 0.016, 0.012);
        }
        box(g, "#b9baa0", x, 0.18, 0, 0.96, 0.01, 0.98);
      }
      return g;
    }
    const deck = new T.Group();
    deck.position.x = -0.5;
    g.add(deck);
    for (let i = 0; i < span * 5; i++)
      box(
        deck,
        i % 3 ? palette.wood : "#96704a",
        0.1 + i * 0.2,
        0.12,
        0,
        0.19,
        0.13,
        1.3,
      );
    for (const z of [-0.65, 0.65]) {
      box(deck, palette.beam, span / 2, 0.58, z, span, 0.07, 0.07);
      for (let i = 0; i <= span; i++)
        box(deck, palette.wood, i, 0.36, z, 0.07, 0.5, 0.07);
    }
    g.userData.deck = deck;
    return g;
  }
  if (type === "wall" || type === "gate" || type === "tower") {
    if (type === "wall" && def?.material === "stone") {
      const deck = fortificationSurface(e.type).height;
      const width = e.type === "stoneRampart" ? 0.84 : 0.45;
      box(g, palette.stone, 0, deck / 2, 0, width, deck, 1);
      for (const z of [-0.35, 0.05, 0.4])
        box(g, "#b2b4a1", -width / 2 - 0.035, deck + 0.15, z, 0.14, 0.3, 0.22);
      return g;
    }
    const stone = type === "tower";
    const w = type === "gate" ? 2 : 1;
    if (type === "gate") {
      for (const z of [-1, 1]) {
        box(g, palette.stone, 0, 0.4, z, 0.65, 0.8, 0.65);
        box(
          g,
          def?.material === "stone" ? palette.stone : palette.wood,
          0,
          1.35,
          z,
          0.5,
          1.2,
          0.5,
        );
        roofAt(g, 0.8, 0.8, 2.05, 0, z, color);
      }
      box(g, palette.beam, 0, 1.75, 0, 0.4, 0.2, 2.4);
      const door = box(g, palette.wood, 0, 0.85, 0, 0.25, 1.6, 1.5);
      for (const y of [0.35, 1.3])
        box(door, "#454e49", 0, y - 0.85, 0, 0.28, 0.09, 1.5);
      g.userData.door = door;
    } else if (type === "tower" && e.type !== "stoneTower") {
      for (const x of [-0.45, 0.45])
        for (const z of [-0.45, 0.45])
          box(g, palette.beam, x, 1, z, 0.15, 2, 0.15);
      box(
        g,
        palette.wood,
        0,
        fortificationSurface(e.type).height - 0.1,
        0,
        1.3,
        0.2,
        1.3,
      );
      for (const z of [-0.65, 0.65]) {
        box(g, palette.wood, 0, 2.22, z, 1.4, 0.12, 0.08);
        box(g, palette.wood, 0, 2.5, z, 1.4, 0.08, 0.08);
      }
      const brace = box(g, palette.wood, 0, 1, 0, 1.4, 0.09, 0.1);
      brace.rotation.z = 0.7;
      flag(g, 0.4, 2.8, 0.4, "#d3b673");
    } else if (stone) {
      box(g, palette.stone, 0, 1, 0, 1.15, 2, 1.15);
      box(
        g,
        "#b4b3a0",
        0,
        fortificationSurface(e.type).height - 0.1,
        0,
        1.4,
        0.2,
        1.4,
      );
      for (const x of [-0.5, 0, 0.5])
        for (const z of [-0.5, 0.5])
          box(g, palette.stone, x, 2.2, z, 0.28, 0.4, 0.3);
      windowBox(g, 0, 1.4, 0.59);
      flag(g, 0.4, 2.8, 0.4, "#d3b673");
    } else {
      for (let i = 0; i < 5; i++) {
        cyl(
          g,
          i % 2 ? palette.wood : "#8d6542",
          -0.3,
          0.65,
          -0.4 + i * 0.2,
          0.12,
          1.3,
          5,
        );
        mesh(
          new T.ConeGeometry(0.12, 0.24, 5),
          palette.wood,
          g,
          -0.3,
          1.4,
          -0.4 + i * 0.2,
        );
      }
      for (const y of [0.3, 0.9])
        box(g, palette.beam, -0.16, y, 0, 0.1, 0.1, 1);
      const deck = fortificationSurface(e.type).height;
      box(g, palette.wood, 0.1, deck - 0.06, 0, 0.6, 0.12, 1);
      for (const z of [-0.4, 0.4])
        box(
          g,
          palette.beam,
          0.3,
          (deck - 0.12) / 2,
          z,
          0.08,
          deck - 0.12,
          0.08,
        );
    }
    void w;
    return g;
  }
  const large = type === "hall" || type === "castle",
    w = large ? 2.6 : type === "warehouse" ? 2.3 : 1.8,
    d = large ? 2.2 : 1.6,
    h = large ? 1.8 : 1.15;
  box(g, "#858b7d", 0, 0.12, 0, w + 0.25, 0.24, d + 0.25);
  box(
    g,
    def?.material === "stone" ? palette.stone : palette.plaster,
    0,
    h / 2 + 0.2,
    0,
    w,
    h,
    d,
  );
  for (const x of [-w / 2, w / 2])
    for (const z of [-d / 2, d / 2])
      box(g, palette.beam, x, h / 2 + 0.2, z, 0.12, h + 0.1, 0.12);
  box(g, palette.beam, 0, 0.5, d / 2 + 0.02, 0.43, 0.85, 0.08);
  sphere(g, "#d6ae63", 0.13, 0.5, d / 2 + 0.08, 0.035);
  for (const x of [-w * 0.31, w * 0.31])
    windowBox(g, x, h * 0.66, d / 2 + 0.04);
  if (!e.sharedRoof) roof(g, w, d, h + 0.7, color);
  box(g, palette.beam, 0, h * 0.6, -d / 2, 0.1, h, 0.1);
  if (large) {
    for (const x of [-1.6, 1.6]) {
      cyl(g, palette.stone, x, 1.1, -0.4, 0.48, 2.2);
      mesh(new T.ConeGeometry(0.65, 0.9, 8), palette.roof, g, x, 2.6, -0.4);
    }
    flag(g, 0.8, 3.5, 0, "#d8bb72");
    for (let i = 0; i < 3; i++)
      box(g, palette.stone, 0, 0.08 + i * 0.07, 1.5 - i * 0.2, 1.1, 0.15, 0.4);
  }
  if (type === "house") {
    box(g, palette.stone, -0.55, h + 0.65, -0.2, 0.3, 0.8, 0.3);
    for (let i = 0; i < 3; i++)
      sphere(g, "#aeb7a5", -0.55, h + 1.3 + i * 0.35, -0.2, 0.12 + i * 0.05);
  }
  if (type === "farm") {
    for (let i = 0; i < 5; i++)
      for (let j = 0; j < 7; j++) {
        const x = 1.3 + i * 0.28,
          z = -1 + j * 0.32;
        box(g, "#867047", x, 0.015, z, 0.24, 0.03, 0.27);
        cyl(g, "#b6aa5b", x, 0.22, z, 0.026, 0.42, 4);
        sphere(g, "#d3c273", x, 0.43, z, 0.08, 0.55, 1.4, 0.55);
      }
    for (const z of [-1.3, 1.3]) {
      box(g, palette.wood, 1.9, 0.35, z, 2.2, 0.07, 0.07);
      for (const x of [0.9, 2.9])
        box(g, palette.wood, x, 0.25, z, 0.08, 0.5, 0.08);
    }
  }
  if (type === "mill") {
    cyl(g, palette.stone, 0, 0.9, 0, 0.65, 1.8, 10, 0.48);
    roof(g, 1.7, 1.7, 2.3, palette.red);
    const sails = new T.Group();
    sails.position.set(0, 1.65, 1.1);
    g.add(sails);
    for (let i = 0; i < 4; i++) {
      const blade = new T.Group();
      blade.rotation.z = (i * Math.PI) / 2;
      box(blade, palette.wood, 0, 0.65, 0, 0.07, 1.3, 0.06);
      box(blade, "#dacda9", 0.17, 0.78, 0, 0.34, 0.8, 0.025);
      sails.add(blade);
    }
    g.userData.sails = sails;
  }
  if (type === "lumbermill" || type === "lumber") {
    for (let i = 0; i < 5; i++) {
      const log = cyl(
        g,
        palette.wood,
        1.3,
        0.16 + (i % 2) * 0.23,
        -0.6 + i * 0.3,
        0.13,
        1.1,
      );
      log.rotation.z = Math.PI / 2;
    }
    const wheel = new T.Group();
    wheel.position.set(-1.1, 0.85, 0);
    g.add(wheel);
    const ring = new T.Mesh(
      new T.TorusGeometry(0.55, 0.07, 5, 10),
      mat(palette.wood),
    );
    wheel.add(ring);
    for (let i = 0; i < 6; i++) {
      const spoke = box(wheel, palette.beam, 0, 0, 0, 0.055, 1.1, 0.07);
      spoke.rotation.z = (i * Math.PI) / 3;
    }
    g.userData.wheel = wheel;
  }
  if (type === "quarry") {
    for (let i = 0; i < 7; i++)
      sphere(
        g,
        i % 2 ? "#8d948a" : "#b1b2a0",
        1.2 + Math.sin(i) * 0.5,
        0.2,
        -0.7 + i * 0.25,
        0.3,
        1,
        0.7,
        1,
      );
    const arm = box(g, palette.wood, 1.3, 1.5, 0, 0.15, 2.8, 0.15);
    arm.rotation.z = -0.3;
    box(g, palette.beam, 1.1, 2.6, 0, 1.5, 0.15, 0.15);
  }
  if (type === "market") {
    const canopy = box(g, "#bd965a", 0, 1.1, 1.25, 2, 0.13, 1);
    canopy.rotation.x = 0.18;
    for (let i = 0; i < 6; i++)
      box(
        g,
        i % 2 ? "#e5d4a0" : "#8d4f3c",
        -0.85 + i * 0.34,
        1.15,
        1.25,
        0.33,
        0.04,
        1,
      );
    for (const x of [-0.9, 0.9])
      box(g, palette.wood, x, 0.55, 1.6, 0.07, 1.1, 0.07);
    box(g, palette.wood, 0, 0.4, 1.4, 1.6, 0.25, 0.55);
    for (let i = 0; i < 5; i++)
      sphere(g, i % 2 ? "#ae6a3d" : "#8e9d58", -0.6 + i * 0.3, 0.62, 1.4, 0.12);
  }
  if (type === "barracks") {
    flag(g, -0.9, 2, 0.9, "#d1b276");
    for (let i = 0; i < 4; i++) {
      const spear = box(
        g,
        "#757a76",
        1.2,
        0.8,
        -0.5 + i * 0.3,
        0.035,
        1.5,
        0.035,
      );
      spear.rotation.z = 0.2;
      mesh(
        new T.ConeGeometry(0.08, 0.2, 4),
        "#bcc3b8",
        g,
        1.05,
        1.6,
        -0.5 + i * 0.3,
      );
    }
  }
  if (type === "forge") {
    box(g, "#676e66", 0.6, 1.6, -0.3, 0.55, 1.8, 0.55);
    box(g, "#443e35", 1.2, 0.4, 0.5, 0.55, 0.4, 0.4);
    box(g, "#f9b859", 1.2, 0.64, 0.5, 0.33, 0.03, 0.2);
  }
  if (type === "hospital") {
    box(g, "#eadfc0", 0, h + 0.4, d / 2 + 0.1, 0.65, 0.6, 0.03);
    box(g, "#934f3f", 0, h + 0.4, d / 2 + 0.13, 0.14, 0.46, 0.03);
    box(g, "#934f3f", 0, h + 0.4, d / 2 + 0.15, 0.44, 0.14, 0.03);
  }
  if (type === "warehouse") {
    for (let i = 0; i < 4; i++) {
      box(
        g,
        palette.wood,
        1.25,
        0.24 + (i % 2) * 0.42,
        -0.4 + Math.floor(i / 2) * 0.5,
        0.45,
        0.42,
        0.45,
      );
      box(
        g,
        palette.beam,
        1.25,
        0.24 + (i % 2) * 0.42,
        -0.15 + Math.floor(i / 2) * 0.5,
        0.46,
        0.07,
        0.04,
      );
    }
  }
  return g;
}
function roofAt(
  p: T.Object3D,
  w: number,
  d: number,
  y: number,
  x: number,
  z: number,
  c: string,
) {
  const r = new T.Group();
  r.position.set(x, 0, z);
  p.add(r);
  roof(r, w, d, y, c);
}
function damageFortification(g: T.Group, e: VisualEntity) {
  const stage = damageStage(e.hp, e.maxHp),
    family = buildingDefs[e.type]?.behavior || e.type;
  if (!stage || !["wall", "gate"].includes(family)) return g;
  const wood = buildingDefs[e.type]?.material === "wood",
    width =
      family === "gate"
        ? e.type === "fortifiedGate"
          ? 0.65
          : 0.25
        : wood || e.type === "stoneRampart"
          ? 0.84
          : 0.45;
  const cuts = new T.Group();
  g.add(cuts);
  for (const side of [-1, 1])
    for (let i = 0; i < stage + 1; i++) {
      const y = 0.25 + i * 0.16,
        z = -0.33 + (i % 2) * 0.4;
      const points = [
        new T.Vector3(side * (width / 2 + 0.012), y + 0.27, z - 0.12),
        new T.Vector3(side * (width / 2 + 0.014), y + 0.12, z + 0.03),
        new T.Vector3(side * (width / 2 + 0.015), y, z - 0.04),
      ];
      const crack = new T.Mesh(
        new T.TubeGeometry(
          new T.CatmullRomCurve3(points),
          5,
          0.012 + stage * 0.004,
          4,
          false,
        ),
        mat(wood ? "#493726" : "#51564a"),
      );
      cuts.add(crack);
      const chip = box(
        cuts,
        wood ? "#5b4029" : "#797e6a",
        side * (width / 2 + 0.02),
        y + 0.1,
        z,
        0.025,
        0.1 + stage * 0.025,
        0.12,
      );
      chip.rotation.x = 0.4;
    }
  if (e.lastDamageKind === "ballistaTower") {
    for (const side of [-1, 1])
      for (let i = 0; i < stage + 1; i++) {
        const y = 0.42 + i * 0.18,
          z = -0.38 + (i % 3) * 0.28;
        const shaft = cyl(
          cuts,
          "#bba16e",
          side * (width / 2 + 0.18),
          y,
          z,
          0.018,
          0.42,
          5,
        );
        shaft.rotation.z = Math.PI / 2;
        box(cuts, "#ddd5b6", side * (width / 2 + 0.35), y, z, 0.1, 0.08, 0.025);
      }
  }
  if (family === "gate" && g.userData.gateDoor) {
    const grille = g.userData.gateDoor as T.Group;
    grille.add(cuts);
    if (stage >= 2 && grille.children[3]) grille.children[3].visible = false;
    if (stage === 3 && grille.children[1]) grille.children[1].rotation.x = 0.3;
  }
  if (family === "wall" && !wood) {
    if (stage >= 2 && g.children[2]) g.children[2].visible = false;
    if (stage === 3 && g.children[3]) g.children[3].rotation.x = 0.35;
  }
  if (family === "gate" && g.userData.door) {
    const door = g.userData.door as T.Mesh;
    door.add(cuts);
    cuts.position.y = -0.85;
    // Visible splintered gaps; the collision stays closed until the gate is destroyed.
    door.geometry.dispose();
    door.geometry = new T.BoxGeometry(0.25, 1.6, 1.5);
    door.scale.z = 1 - stage * 0.12;
    for (let i = 0; i < stage; i++) {
      const splinter = box(
        door,
        "#d0a16a",
        0,
        0.35 - i * 0.32,
        0.64 - i * 0.2,
        0.27,
        0.045,
        0.3,
      );
      splinter.rotation.x = 0.35 + i * 0.2;
    }
  }
  return g;
}
function fortificationRubble(e: VisualEntity) {
  const g = new T.Group(),
    original = String(e.originalType),
    wood = buildingDefs[original]?.material === "wood";
  for (let i = 0; i < 12; i++) {
    const a = i * 2.399,
      r = 0.16 + (i % 4) * 0.15;
    const m = box(
      g,
      wood ? (i % 2 ? "#966d43" : "#604b32") : i % 2 ? "#a1a58f" : "#7d8574",
      Math.cos(a) * r,
      0.08 + (i % 3) * 0.055,
      Math.sin(a) * r,
      wood ? 0.14 : 0.24,
      wood ? 0.12 : 0.18,
      wood ? 0.8 : 0.3,
    );
    m.rotation.set(i * 0.17, i * 0.7, i * 0.12);
  }
  return g;
}

function human(e: VisualEntity) {
  const g = new T.Group(),
    enemy = e.faction === "enemy",
    hero = e.kind === "hero",
    cloth = enemy
      ? "#9b5140"
      : hero
        ? outfits[(e.outfit || "default") as keyof typeof outfits][1]
        : e.kind === "worker"
          ? "#b3a27c"
          : "#517b83";
  const legs = new T.Group();
  g.add(legs);
  for (const x of [-0.11, 0.11]) {
    const l = box(legs, "#4d4437", x, 0.19, 0, 0.13, 0.38, 0.15);
    l.userData.leg = x;
    box(l, "#40392f", 0, -0.16, 0.04, 0.15, 0.1, 0.23);
  }
  cyl(g, cloth, 0, 0.56, 0, 0.23, 0.5, 6, 0.18);
  box(g, palette.beam, 0, 0.42, 0, 0.44, 0.07, 0.29);
  sphere(g, "#d7b58b", 0, 0.95, 0, 0.17);
  sphere(
    g,
    hero
      ? e.outfit === "knight"
        ? "#a9b4b2"
        : e.outfit === "scout"
          ? "#49653d"
          : e.outfit === "desert"
            ? "#eee0ba"
            : "#6d5436"
      : e.kind === "worker"
        ? "#b49a62"
        : "#8b9b97",
    0,
    1.06,
    0,
    0.18,
    1,
    0.55,
    1,
  );
  if (hero && e.outfit === "knight")
    box(g, "#3c4b49", 0, 1.05, 0.165, 0.25, 0.06, 0.035);
  if (hero && e.outfit === "scout")
    mesh(new T.ConeGeometry(0.2, 0.28, 5), "#49653d", g, 0, 1.18, 0);
  if (hero && e.outfit === "desert") {
    box(g, "#eee0ba", 0, 1.08, 0, 0.37, 0.1, 0.32);
    box(g, "#b48555", 0, 0.85, 0.12, 0.34, 0.08, 0.07);
  }
  if (hero) {
    const cape = box(g, "#466d72", 0, 0.59, -0.19, 0.43, 0.62, 0.04);
    cape.rotation.x = -0.15;
    g.userData.cape = cape;
  }
  for (const x of [-0.29, 0.29]) {
    const a = box(g, cloth, x, 0.58, e.driving ? 0.17 : 0, 0.12, 0.4, 0.14);
    a.rotation.z = x > 0 ? -0.15 : 0.15;
    if (e.driving) a.rotation.x = -1.05;
    sphere(
      g,
      "#d7b58b",
      x,
      e.driving ? 0.48 : 0.38,
      e.driving ? 0.34 : 0,
      0.08,
    );
  }
  if (e.kind === "archer") {
    const b = new T.Mesh(
      new T.TorusGeometry(0.3, 0.025, 5, 12, Math.PI),
      mat(palette.wood),
    );
    b.position.set(0.34, 0.62, 0.08);
    g.add(b);
    box(g, "#ddd3b8", 0.34, 0.62, 0.08, 0.025, 0.6, 0.025);
  } else if (e.kind !== "worker") {
    box(g, "#bac4bc", 0.37, 0.66, 0.05, 0.06, 0.75, 0.05);
    box(g, palette.gold, 0.37, 0.38, 0.05, 0.25, 0.05, 0.09);
    if (e.type === "shield" || e.type === "shieldbearer") {
      const shield = cyl(g, "#597477", -0.35, 0.6, 0.13, 0.25, 0.08, 8);
      shield.rotation.x = Math.PI / 2;
    }
  }
  g.userData.legs = legs;
  return g;
}
function animal(e: VisualEntity) {
  const g = new T.Group(),
    dog = e.kind === "dog",
    camel = e.type === "camel" || e.kind === "camel",
    s = dog ? 0.48 : 1,
    c = dog
      ? dogCoats[(e.dogColor || "brown") as keyof typeof dogCoats][1]
      : camel
        ? "#bc9b65"
        : "#8b6143";
  sphere(g, c, 0, 0.7 * s, 0, 0.4 * s, 1, 1, 1.8);
  const draftLegs: T.Group[] = [];
  for (const x of [-0.23, 0.23])
    for (const z of [-0.4, 0.4]) {
      const pivot = new T.Group();
      pivot.position.set(x * s, 0.63 * s, z * s);
      pivot.userData.phase = x > 0 === z > 0 ? 0 : Math.PI;
      g.add(pivot);
      box(pivot, c, 0, -0.32 * s, 0, 0.12 * s, 0.65 * s, 0.13 * s);
      box(pivot, "#443a30", 0, -0.595 * s, 0, 0.15 * s, 0.08 * s, 0.18 * s);
      draftLegs.push(pivot);
    }
  if (e.draft) g.userData.draftLegs = draftLegs;
  sphere(g, c, 0, 1 * s, 0.48 * s, 0.25 * s, 0.65, 1.5, 0.8);
  sphere(g, c, 0, 1.25 * s, 0.7 * s, 0.24 * s, 0.7, 0.9, 1.3);
  for (const x of [-0.12, 0.12]) {
    const ear = mesh(
      new T.ConeGeometry(0.07 * s, 0.25 * s, 4),
      c,
      g,
      x * s,
      1.5 * s,
      0.64 * s,
    );
    ear.rotation.x = -0.2;
    sphere(g, "#252e25", x * s, 1.31 * s, 0.86 * s, 0.025 * s);
  }
  const tail = box(
    g,
    dog ? c : "#403c30",
    0,
    0.72 * s,
    -0.65 * s,
    0.08 * s,
    0.36 * s,
    0.08 * s,
  );
  tail.rotation.x = 0.5;
  g.userData.tail = tail;
  if (!dog) {
    box(g, "#423b30", 0, 1.02, 0, 0.5, 0.12, 0.55);
    box(g, "#416e72", 0, 0.92, 0, 0.62, 0.08, 0.6);
    if (camel) {
      sphere(g, c, 0, 1.03, -0.25, 0.25, 1, 1.4, 1);
      box(g, "#9e7045", -0.38, 0.8, -0.15, 0.3, 0.45, 0.5);
      box(g, "#9e7045", 0.38, 0.8, -0.15, 0.3, 0.45, 0.5);
    }
  }
  return g;
}
function boat() {
  const g = new T.Group();
  const outline = [
    [-0.9, -0.27],
    [-0.35, -0.43],
    [0.55, -0.34],
    [1.08, 0],
    [0.55, 0.34],
    [-0.35, 0.43],
    [-0.9, 0.27],
  ];
  const band = (
    bottom: number,
    top: number,
    scale0: number,
    scale1: number,
    color: string,
  ) => {
    const vertices: number[] = [];
    for (let i = 0; i < outline.length; i++) {
      const a = outline[i],
        b = outline[(i + 1) % outline.length];
      const p = [a[0] * scale0, bottom, a[1] * scale0],
        q = [b[0] * scale0, bottom, b[1] * scale0],
        r = [b[0] * scale1, top, b[1] * scale1],
        t = [a[0] * scale1, top, a[1] * scale1];
      vertices.push(...p, ...r, ...q, ...p, ...t, ...r);
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
    geo.computeVertexNormals();
    const side = mesh(geo, color, g);
    (side.material as T.MeshStandardMaterial).side = T.DoubleSide;
  };
  // Open clinker hull: narrow keel, distinct plank courses and a hollow interior.
  band(-0.12, 0.06, 0.54, 0.82, "#65442c");
  band(0.06, 0.2, 0.82, 0.96, "#956139");
  band(0.2, 0.36, 0.96, 1, "#b0804c");
  band(0.06, 0.32, 0.7, 0.88, "#715137");
  const floor: number[] = [];
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i],
      b = outline[(i + 1) % outline.length];
    floor.push(
      0,
      BOAT_FLOOR_HEIGHT,
      0,
      b[0] * 0.78,
      BOAT_FLOOR_HEIGHT,
      b[1] * 0.78,
      a[0] * 0.78,
      BOAT_FLOOR_HEIGHT,
      a[1] * 0.78,
    );
  }
  const floorGeo = new T.BufferGeometry();
  floorGeo.setAttribute("position", new T.Float32BufferAttribute(floor, 3));
  floorGeo.computeVertexNormals();
  mesh(floorGeo, "#8d633f", g);
  const line = (points: T.Vector3[], color: string, radius: number) =>
    mesh(
      new T.TubeGeometry(
        new T.CatmullRomCurve3(points, false, "centripetal"),
        Math.max(8, points.length * 3),
        radius,
        5,
        false,
      ),
      color,
      g,
    );
  const rim = outline.map(([x, z]) => new T.Vector3(x, 0.37, z));
  rim.push(rim[0].clone());
  line(rim, "#4e4432", 0.035);
  const inner = outline.map(
    ([x, z]) => new T.Vector3(x * 0.89, 0.32, z * 0.89),
  );
  inner.push(inner[0].clone());
  line(inner, "#c69a62", 0.026);
  for (const x of [-0.58, 0.43])
    box(g, "#c29a63", x, 0.22, 0, 0.18, 0.055, 0.58);
  for (const x of [-0.45, 0, 0.4])
    box(g, "#4f4433", x, BOAT_FLOOR_HEIGHT + 0.01, 0, 0.035, 0.035, 0.52);
  cyl(g, "#59432e", -0.12, 1.04, 0, 0.028, 1.82, 8);
  box(g, "#59432e", -0.12, 1.86, 0, 1.02, 0.035, 0.035);
  box(g, "#59432e", -0.12, 0.83, 0, 1.32, 0.04, 0.04);
  // A billowing cloth surface, rather than a thick rectangular board.
  const sail = new T.PlaneGeometry(1, 1, 8, 8),
    positions = sail.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const u = positions.getX(i) + 0.5,
      v = positions.getY(i) + 0.5;
    positions.setXYZ(
      i,
      -0.12 + (u - 0.5) * (1.3 - 0.3 * v),
      0.86 + v,
      0.035 + 0.16 * Math.sin(Math.PI * u) * Math.sin(Math.PI * v),
    );
  }
  sail.computeVertexNormals();
  const cloth = mesh(sail, "#e4d9b5", g);
  cloth.material = new T.MeshStandardMaterial({
    color: "#e4d9b5",
    roughness: 1,
    side: T.DoubleSide,
  });
  // A muted teal pennant ties the boat to the valley's harbor colors.
  const pennant = new T.BufferGeometry();
  pennant.setAttribute(
    "position",
    new T.Float32BufferAttribute(
      [-0.12, 1.98, 0, 0.24, 1.91, 0, -0.12, 1.84, 0],
      3,
    ),
  );
  pennant.computeVertexNormals();
  const flagMesh = mesh(pennant, "#416c70", g);
  flagMesh.material = new T.MeshStandardMaterial({
    color: "#416c70",
    roughness: 1,
    side: T.DoubleSide,
  });
  line(
    [new T.Vector3(-0.12, 1.94, 0), new T.Vector3(1.02, 0.42, 0)],
    "#c6b17c",
    0.009,
  );
  line(
    [new T.Vector3(-0.12, 1.94, 0), new T.Vector3(-0.87, 0.38, 0)],
    "#c6b17c",
    0.009,
  );
  box(g, "#59432e", -1.0, 0.07, 0, 0.12, 0.45, 0.07);
  box(g, "#a17b49", -0.81, 0.4, 0, 0.38, 0.035, 0.04);
  // Stowed oars leave the middle seat available to a real passenger.
  for (const z of [-0.29, 0.29]) {
    const oar = cyl(g, "#c49c63", 0.06, 0.27, z, 0.016, 1.2, 6);
    oar.rotation.z = Math.PI / 2;
    box(g, "#c49c63", 0.68, 0.27, z, 0.24, 0.028, 0.09);
  }
  return g;
}
function tree(e: VisualEntity) {
  const g = new T.Group(),
    r = rand(e.x, e.z),
    pine = r > 0.48;
  cyl(g, "#65513a", 0, 0.65, 0, 0.13, 1.3, 5);
  if (pine) {
    for (let i = 0; i < 3; i++)
      mesh(
        new T.ConeGeometry(0.85 - i * 0.2, 1.4, 7),
        ["#365c44", "#456e4b", "#527c50"][i],
        g,
        0,
        1.3 + i * 0.55,
        0,
      );
  } else {
    sphere(g, "#54794c", 0, 1.9, 0, 0.9, 1, 1, 1);
    sphere(g, "#648655", 0.45, 1.7, 0.2, 0.65);
    sphere(g, "#486d48", -0.4, 1.6, -0.3, 0.6);
  }
  g.scale.setScalar(0.8 + r * 0.45);
  return g;
}
function rand(x: number, z: number) {
  return ((Math.sin(x * 127.1 + z * 311.7) * 43758.5453) % 1) * 0.5 + 0.5;
}
function siegeEngine(e: VisualEntity) {
  const g = new T.Group(),
    wood = "#9a7045",
    dark = "#54432f",
    iron = "#69736c",
    rope = "#c9b17c";
  const beam = (a: T.Vector3, b: T.Vector3, width: number, color = wood) => {
    const m = box(g, color, 0, 0, 0, width, a.distanceTo(b), width);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(
      new T.Vector3(0, 1, 0),
      b.clone().sub(a).normalize(),
    );
    return m;
  };
  for (const x of [-0.42, 0.42]) box(g, dark, x, 0.4, 0, 0.15, 0.18, 1.7);
  for (const z of [-0.57, 0.57]) {
    const axle = cyl(g, iron, 0, 0.3, z, 0.055, 1.35, 8);
    axle.rotation.z = Math.PI / 2;
    for (const x of [-0.62, 0.62]) {
      const wheel = new T.Group();
      wheel.position.set(x, 0.3, z);
      g.add(wheel);
      const disk = cyl(wheel, wood, 0, 0, 0, 0.3, 0.1, 12);
      disk.rotation.z = Math.PI / 2;
      const rim = mesh(new T.TorusGeometry(0.28, 0.025, 5, 12), iron, wheel);
      rim.rotation.y = Math.PI / 2;
      for (let i = 0; i < 6; i++) {
        const spoke = box(wheel, "#c19b62", 0, 0, 0, 0.115, 0.48, 0.035);
        spoke.rotation.x = (i * Math.PI) / 3;
      }
      const hub = cyl(wheel, iron, 0, 0, 0, 0.075, 0.16, 8);
      hub.rotation.z = Math.PI / 2;
    }
  }
  if (e.type === "ram") {
    for (const z of [-0.65, 0.5]) {
      for (const x of [-0.46, 0.46]) box(g, wood, x, 0.85, z, 0.12, 0.85, 0.12);
      box(g, wood, 0, 1.27, z, 1.12, 0.12, 0.13);
      for (const x of [-0.23, 0.23]) {
        cyl(g, iron, x, 1.04, z, 0.014, 0.39, 5);
        mesh(new T.TorusGeometry(0.055, 0.014, 5, 8), iron, g, x, 0.85, z);
      }
    }
    const firstBeamPart = g.children.length;
    const log = cyl(g, "#987043", 0, 0.8, 0.14, 0.18, 2.45, 10);
    log.rotation.x = Math.PI / 2;
    for (const z of [-0.72, 0.5, 1.2]) {
      const band = cyl(g, iron, 0, 0.8, z, 0.195, 0.09, 10);
      band.rotation.x = Math.PI / 2;
    }
    box(g, "#9da79b", 0, 0.8, 1.43, 0.4, 0.4, 0.25);
    box(g, "#555f59", 0, 0.8, 1.57, 0.27, 0.26, 0.035);
    for (const x of [-0.12, 0.12])
      for (const y of [0.68, 0.92]) sphere(g, "#c2c5b2", x, y, 1.59, 0.026);
    const movingBeam = new T.Group();
    for (const part of g.children.slice(firstBeamPart)) movingBeam.add(part);
    g.add(movingBeam);
    g.userData.ramBeam = movingBeam;
    // A low pitched hide canopy, open at the sides so the ram remains visible.
    for (const side of [-1, 1]) {
      const panel = box(
        g,
        side < 0 ? "#955a3e" : "#ad7050",
        side * 0.34,
        1.52,
        -0.12,
        0.77,
        0.065,
        1.85,
      );
      panel.rotation.z = -side * 0.42;
      const edge = box(g, dark, side * 0.69, 1.37, -0.12, 0.055, 0.055, 1.95);
      for (const z of [-0.84, -0.23, 0.39])
        box(g, "#c39a66", side * 0.36, 1.59, z, 0.12, 0.03, 0.035).rotation.z =
          -side * 0.42;
    }
    box(g, dark, 0, 1.7, -0.12, 0.07, 0.07, 1.95);
  } else {
    for (const z of [-0.65, 0.58]) box(g, wood, 0, 0.5, z, 1.12, 0.12, 0.14);
    for (const x of [-0.38, 0.38]) {
      beam(new T.Vector3(x, 0.46, -0.64), new T.Vector3(x, 1.25, 0), 0.13);
      beam(new T.Vector3(x, 0.46, 0.64), new T.Vector3(x, 1.25, 0), 0.13);
      box(g, iron, x, 1.2, 0, 0.19, 0.2, 0.18);
    }
    const pivot = cyl(g, iron, 0, 1.22, 0, 0.09, 1.02, 10);
    pivot.rotation.z = Math.PI / 2;
    const torsion = cyl(g, rope, 0, 1.12, -0.02, 0.13, 0.6, 10);
    torsion.rotation.z = Math.PI / 2;
    for (let i = 0; i < 8; i++) {
      const coil = mesh(
        new T.TorusGeometry(0.135, 0.015, 5, 12),
        "#9f895f",
        g,
        -0.25 + i * 0.07,
        1.12,
        -0.02,
      );
      coil.rotation.y = Math.PI / 2;
    }
    const throwingArm = beam(
      new T.Vector3(0, 0.87, 0.52),
      new T.Vector3(0, 1.84, -1.02),
      0.13,
      dark,
    );
    const cup = mesh(
      new T.SphereGeometry(
        0.25,
        12,
        6,
        0,
        Math.PI * 2,
        Math.PI / 2,
        Math.PI / 2,
      ),
      "#b58c52",
      g,
      0,
      1.86,
      -1.03,
    );
    cup.material = new T.MeshStandardMaterial({
      color: "#b58c52",
      side: T.DoubleSide,
      roughness: 1,
    });
    const stone = sphere(g, "#a6aa95", 0, 1.84, -1.03, 0.18, 1, 0.9, 1);
    const swing = new T.Group();
    swing.position.set(0, 1.22, 0);
    for (const part of [throwingArm, cup, stone]) {
      part.position.sub(swing.position);
      swing.add(part);
    }
    g.add(swing);
    g.userData.siegeArm = swing;
    g.userData.loadedStone = stone;
    const winch = cyl(g, wood, 0, 0.62, -0.62, 0.1, 0.67, 10);
    winch.rotation.z = Math.PI / 2;
    for (const x of [-0.38, 0.38])
      box(g, iron, x, 0.64, -0.62, 0.06, 0.23, 0.08);
    box(g, iron, 0.46, 0.72, -0.62, 0.045, 0.26, 0.04);
    box(g, wood, 0.53, 0.84, -0.62, 0.18, 0.055, 0.055);
    beam(
      new T.Vector3(0, 0.65, -0.62),
      new T.Vector3(0, 1.67, -0.8),
      0.015,
      rope,
    );
    box(g, dark, 0, 1.35, 0.13, 0.98, 0.12, 0.14);
  }
  return g;
}

export class ValleyRenderer {
  renderer: T.WebGLRenderer;
  scene = new T.Scene();
  camera: T.OrthographicCamera;
  root = new T.Group();
  objects = new Map<string, T.Group>();
  rings = new Map<string, T.Mesh>();
  target = new T.Vector3(19, 0, 30);
  zoomLevel = 24;
  private ray = new T.Raycaster();
  private pointer = new T.Vector2();
  private plane = new T.Plane(new T.Vector3(0, 1, 0), 0);
  private water: T.Mesh;
  private ripples: T.Group;
  private last = new Map<string, T.Vector3>();
  private ballistaImpacts = new BallistaImpacts();
  private ghost = new T.Group();
  private frameCount = 0;
  private lastRenderTime: number | undefined;
  fps = 60;
  onFortificationSound?: (
    kind: "crack" | "collapse",
    wood: boolean,
    position: { x: number; z: number },
  ) => void;
  private fpsStart = performance.now();
  quality = "high";
  private crowds = new Map<string, T.InstancedMesh[]>();
  private dummy = new T.Object3D();
  private complexRoofs = new T.Group();
  private complexRoofSignature = "";
  private wallRamps = new T.Group();
  private wallRampSignature = "";
  private basePaths = new T.Group();
  private basePathTiles = new Map<string, T.Mesh>();
  private channelWater = new Map<string, T.Mesh>();
  private bankDecor = new T.Group();
  private bankInstances: {
    mesh: T.InstancedMesh;
    matrices: T.Matrix4[];
    positions: { x: number; z: number }[];
  }[] = [];
  private bankSignature = "";
  private effects: {
    mesh: T.Mesh;
    start: number;
    from: T.Vector3;
    to: T.Vector3;
    life: number;
    arc?: number;
    impact?: { wood: boolean; strength: number };
  }[] = [];
  private collapses: {
    id: string;
    model: T.Group;
    start: number;
    origin: T.Vector3;
    wood: boolean;
    burst: boolean;
  }[] = [];
  private impactBits: {
    mesh: T.Mesh;
    start: number;
    origin: T.Vector3;
    particle: ImpactParticle;
    strength: number;
  }[] = [];
  private dustGeometry = new T.IcosahedronGeometry(1, 1);
  private chipGeometry = new T.BoxGeometry(1, 1, 1);
  private burstImpact(at: T.Vector3, wood: boolean, strength = 1) {
    const start = performance.now() / 1000;
    for (const particle of impactParticles(wood)) {
      if (this.impactBits.length >= 180) break;
      const mesh = new T.Mesh(
        particle.dust ? this.dustGeometry : this.chipGeometry,
        new T.MeshStandardMaterial({
          color: particle.dust ? "#b7a481" : wood ? "#a77b4b" : "#b5b39c",
          transparent: true,
          opacity: particle.dust ? 0.22 : 1,
          depthWrite: !particle.dust,
          roughness: 1,
          flatShading: true,
        }),
      );
      mesh.position.copy(at);
      mesh.scale.setScalar(particle.size);
      mesh.rotation.set(particle.vx, particle.vy, particle.vz);
      if (wood && !particle.dust) mesh.scale.z *= 2.7;
      this.scene.add(mesh);
      this.impactBits.push({
        mesh,
        start,
        origin: at.clone(),
        particle,
        strength,
      });
    }
  }
  constructor(public container: HTMLElement) {
    this.renderer = new T.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.append(this.renderer.domElement);
    this.scene.background = new T.Color("#a6b5a1");
    this.scene.fog = new T.Fog("#a6b5a1", 58, 110);
    this.camera = new T.OrthographicCamera(-20, 20, 15, -15, 0.1, 160);
    this.scene.add(new T.HemisphereLight("#f1e8cf", "#536a50", 2.2));
    const sun = new T.DirectionalLight("#fff0cf", 3.1);
    sun.position.set(-22, 40, 15);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -45;
    sun.shadow.camera.right = 45;
    sun.shadow.camera.top = 45;
    sun.shadow.camera.bottom = -45;
    // Bias is normalized over the shadow camera's depth range. The default
    // far=500 amplified the old bias into a visible gap beneath every object.
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 130;
    sun.shadow.bias = -0.00004;
    sun.shadow.normalBias = 0.008;
    this.scene.add(sun);
    this.scene.add(sun.target);
    sun.target.position.set(24, 0, 30);
    this.scene.add(this.root);
    this.scene.add(this.ghost);
    this.ground();
    this.batchScenery();
    const waterMat = new T.MeshStandardMaterial({
      color: "#578d89",
      roughness: 0.28,
      metalness: 0.18,
      transparent: true,
      opacity: 0.94,
    });
    this.water = new T.Mesh(new T.PlaneGeometry(3, 68, 1, 32), waterMat);
    this.water.rotation.x = -Math.PI / 2;
    this.water.position.set(32, -0.04, 32);
    this.water.receiveShadow = true;
    this.scene.add(this.water);
    this.ripples = new T.Group();
    for (let i = 0; i < 85; i++) {
      const line = box(
        this.ripples,
        i % 3 ? "#86afa0" : "#bad0b4",
        31 + rand(i, 3) * 2,
        0.015,
        i * 0.8,
        0.2 + rand(i, 4) * 0.6,
        0.007,
        0.025,
      );
      line.userData.phase = i * 0.7;
    }
    this.scene.add(this.ripples);
    window.addEventListener("resize", () => this.resize());
    this.resize();
  }
  private ground() {
    const backdrop = new T.Mesh(new T.PlaneGeometry(512, 512), mat("#748650"));
    backdrop.rotation.x = -Math.PI / 2;
    backdrop.position.set(32, -0.12, 32);
    backdrop.receiveShadow = true;
    this.scene.add(backdrop);
    const ground = new T.PlaneGeometry(64, 64, 64, 64),
      positions = ground.getAttribute("position"),
      colors: number[] = [];
    const dark = new T.Color("#697f4d"),
      light = new T.Color("#839557");
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i),
        z = positions.getY(i);
      const t =
        0.5 +
        Math.sin(x * 0.24 + Math.sin(z * 0.16)) * 0.22 +
        Math.cos(z * 0.3 - x * 0.08) * 0.15;
      const c = dark.clone().lerp(light, t);
      colors.push(c.r, c.g, c.b);
    }
    ground.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
    const earth = new T.Mesh(
      ground,
      new T.MeshStandardMaterial({ vertexColors: true, roughness: 1 }),
    );
    earth.rotation.x = -Math.PI / 2;
    earth.position.set(32, -0.08, 32);
    earth.receiveShadow = true;
    this.scene.add(earth);
    this.scene.add(this.bankDecor);
    const stones = new T.InstancedMesh(
      new T.IcosahedronGeometry(1, 1),
      mat("#ffffff"),
      140,
    );
    const stoneMatrices: T.Matrix4[] = [],
      stonePositions: { x: number; z: number }[] = [];
    let stoneIndex = 0;
    for (const x of [30.4, 33.6]) {
      box(this.scene, "#a6a47d", x, -0.11, 32, 0.8, 0.1, 64);
      for (let i = 0; i < 70; i++) {
        const r = rand(i, x);
        const px = x + (r - 0.5) * 0.5,
          pz = i * 0.92,
          radius = 0.12 + r * 0.15;
        this.dummy.position.set(px, -0.04, pz);
        this.dummy.scale.set(radius, radius * 0.5, radius);
        this.dummy.rotation.set(0, 0, 0);
        this.dummy.updateMatrix();
        stoneMatrices.push(this.dummy.matrix.clone());
        stonePositions.push({ x: px, z: pz });
        stones.setMatrixAt(stoneIndex, this.dummy.matrix);
        stones.setColorAt(
          stoneIndex,
          new T.Color(i % 2 ? "#8c9a84" : "#a8ad8f"),
        );
        stoneIndex++;
      }
    }
    stones.castShadow = true;
    stones.receiveShadow = true;
    this.bankDecor.add(stones);
    this.bankInstances.push({
      mesh: stones,
      matrices: stoneMatrices,
      positions: stonePositions,
    });
    this.scene.add(this.basePaths);
    for (const [key, p] of villageRoadTiles) {
      const tile = box(
        this.basePaths,
        p.color,
        p.x,
        0.002,
        p.z,
        p.width,
        0.025,
        p.depth,
      );
      this.basePathTiles.set(key, tile);
    }
    for (let i = 0; i < 260; i++) {
      const x = rand(i, 17) * 64,
        z = rand(i, 72) * 64;
      if (x > 30 && x < 34) continue;
      const c = i % 3 ? "#88995d" : "#c7bc77";
      const grass = mesh(
        new T.ConeGeometry(0.05, 0.25, 3),
        c,
        this.scene,
        x,
        0.08,
        z,
      );
      grass.castShadow = false;
    }
    const reeds = new T.InstancedMesh(
        new T.BoxGeometry(0.035, 0.6, 0.035),
        mat("#a1a36d"),
        80,
      ),
      reedMatrices: T.Matrix4[] = [],
      reedPositions: { x: number; z: number }[] = [];
    for (let i = 0; i < 80; i++) {
      const z = rand(i, 45) * 64,
        x = i % 2 ? 30.5 : 33.5;
      this.dummy.position.set(x, 0.2, z);
      this.dummy.scale.set(1, 1, 1);
      this.dummy.rotation.set(0, 0, Math.sin(i) * 0.2);
      this.dummy.updateMatrix();
      reedMatrices.push(this.dummy.matrix.clone());
      reedPositions.push({ x, z });
      reeds.setMatrixAt(i, this.dummy.matrix);
    }
    reeds.castShadow = true;
    this.bankDecor.add(reeds);
    this.bankInstances.push({
      mesh: reeds,
      matrices: reedMatrices,
      positions: reedPositions,
    });
  }
  private batchScenery() {
    const groups = new Map<T.Material, T.Mesh[]>();
    for (const o of [...this.scene.children])
      if (
        o instanceof T.Mesh &&
        !Array.isArray(o.material) &&
        !o.geometry.getAttribute("color")
      ) {
        const list = groups.get(o.material) || [];
        list.push(o);
        groups.set(o.material, list);
      }
    for (const [material, list] of groups) {
      if (list.length < 2) continue;
      const geos = list.map((m) => {
        m.updateMatrix();
        return m.geometry.clone().applyMatrix4(m.matrix);
      });
      const merged = mergeGeometries(geos);
      if (merged) {
        const m = new T.Mesh(merged, material);
        m.receiveShadow = true;
        this.scene.add(m);
        list.forEach((o) => this.scene.remove(o));
      }
      geos.forEach((g) => g.dispose());
    }
  }
  resize() {
    const w = this.container.clientWidth,
      h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    this.syncCamera();
  }
  private syncCamera() {
    const a = this.container.clientWidth / this.container.clientHeight;
    this.camera.left = (-this.zoomLevel * a) / 2;
    this.camera.right = (this.zoomLevel * a) / 2;
    this.camera.top = this.zoomLevel / 2;
    this.camera.bottom = -this.zoomLevel / 2;
    this.camera.position.copy(this.target).add(new T.Vector3(25, 32, 25));
    this.camera.lookAt(this.target);
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
  }
  focus(x: number, z: number) {
    this.target.set(x, 0, z);
    this.syncCamera();
  }
  pan(dx: number, dy: number) {
    const k = this.zoomLevel / this.container.clientHeight;
    const vertical = dy / (32 / Math.hypot(25, 32, 25));
    this.target.x += (-dx - vertical) * k * Math.SQRT1_2;
    this.target.z += (dx - vertical) * k * Math.SQRT1_2;
    this.target.x = T.MathUtils.clamp(this.target.x, 1, 63);
    this.target.z = T.MathUtils.clamp(this.target.z, 1, 63);
    this.syncCamera();
  }
  zoom(delta: number, clientX?: number, clientY?: number) {
    const before =
      clientX !== undefined && clientY !== undefined
        ? this.groundPoint(clientX, clientY)
        : undefined;
    this.zoomLevel = T.MathUtils.clamp(
      this.zoomLevel * Math.exp(delta * 0.001),
      12,
      65,
    );
    this.syncCamera();
    if (before && clientX !== undefined && clientY !== undefined) {
      const after = this.groundPoint(clientX, clientY);
      this.target.x = T.MathUtils.clamp(
        this.target.x + before.x - after.x,
        1,
        63,
      );
      this.target.z = T.MathUtils.clamp(
        this.target.z + before.z - after.z,
        1,
        63,
      );
      this.syncCamera();
    }
  }
  private groundPoint(clientX: number, clientY: number) {
    const r = this.container.getBoundingClientRect();
    this.pointer.set(
      ((clientX - r.left) / r.width) * 2 - 1,
      (-(clientY - r.top) / r.height) * 2 + 1,
    );
    this.ray.setFromCamera(this.pointer, this.camera);
    const p = new T.Vector3();
    this.ray.ray.intersectPlane(this.plane, p);
    return p;
  }
  screen(x: number, z: number, y = 0) {
    const p = new T.Vector3(x, y, z).project(this.camera);
    return {
      x: ((p.x + 1) * this.container.clientWidth) / 2,
      y: ((1 - p.y) * this.container.clientHeight) / 2,
    };
  }
  pick(clientX: number, clientY: number) {
    const r = this.container.getBoundingClientRect();
    this.pointer.set(
      ((clientX - r.left) / r.width) * 2 - 1,
      (-(clientY - r.top) / r.height) * 2 + 1,
    );
    this.ray.setFromCamera(this.pointer, this.camera);
    const hit = this.ray
      .intersectObjects(
        [
          ...this.objects.values(),
          this.complexRoofs,
          ...[...this.crowds.values()].flat(),
        ],
        true,
      )
      .find((h) => {
        let o: T.Object3D | null = h.object;
        while (o) {
          if (o.userData.entityId || o.userData.ids) return true;
          o = o.parent;
        }
        return false;
      });
    let id: string | undefined;
    if (hit) {
      if (hit.instanceId !== undefined)
        id = hit.object.userData.ids?.[hit.instanceId];
      else {
        let o: T.Object3D | null = hit.object;
        while (o) {
          if (o.userData.entityId) {
            id = o.userData.entityId;
            break;
          }
          o = o.parent;
        }
      }
    }
    const p = new T.Vector3();
    this.ray.ray.intersectPlane(this.plane, p);
    return {
      id,
      x: T.MathUtils.clamp(p.x, 0, 63),
      z: T.MathUtils.clamp(p.z, 0, 63),
    };
  }
  setQuality(low: boolean) {
    this.quality = low ? "low" : "high";
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, low ? 1 : 1.7));
    this.renderer.shadowMap.enabled = !low;
    this.resize();
  }
  rotateGhost(rotation: number) {
    this.ghost.rotation.y = (rotation * Math.PI) / 2;
  }
  private clearGhost() {
    this.ghost.traverse((o) => {
      if (o instanceof T.Mesh) {
        o.geometry.dispose();
        for (const m of Array.isArray(o.material) ? o.material : [o.material])
          m.dispose();
      }
    });
    this.ghost.clear();
  }
  setConstructionGhost(members: Entity[], valid: boolean) {
    const signature = JSON.stringify(
      members.map((e) => [e.id, e.type, e.x, e.z, e.rotation]),
    );
    this.ghost.rotation.y = 0;
    this.ghost.position.set(0, -0.08, 0);
    this.ghost.visible = members.length > 0;
    if (this.ghost.userData.type !== signature) {
      this.clearGhost();
      for (const e of members) {
        const g = building({ ...e });
        g.position.set(e.x, 0, e.z);
        g.rotation.y = ((e.rotation ?? 0) * Math.PI) / 2;
        g.traverse((o) => {
          if (o instanceof T.Mesh) {
            o.material = new T.MeshBasicMaterial({
              color: valid ? "#a4dfbe" : "#ce6c54",
              transparent: true,
              opacity: 0.45,
              depthWrite: false,
            });
            o.castShadow = false;
          }
        });
        this.ghost.add(g);
      }
      this.ghost.userData.type = signature;
    }
    this.ghost.traverse((o) => {
      if (o instanceof T.Mesh)
        (o.material as T.MeshBasicMaterial).color.set(
          valid ? "#a4dfbe" : "#ce6c54",
        );
    });
  }
  setGhost(
    x: number,
    z: number,
    type?: string,
    valid = true,
    rotation = 0,
    snapped = false,
  ) {
    this.rotateGhost(rotation);
    this.ghost.visible = !!type;
    if (!type) return;
    if (this.ghost.userData.type !== type) {
      this.clearGhost();
      const m = building({
        id: "ghost",
        kind: "building",
        type,
        x,
        z,
        hp: 1,
        maxHp: 1,
        faction: "player",
      });
      m.traverse((o) => {
        if (o instanceof T.Mesh) {
          o.material = new T.MeshBasicMaterial({
            color: valid ? "#e4d29b" : "#ce6c54",
            transparent: true,
            opacity: 0.45,
            depthWrite: false,
          });
          o.castShadow = false;
        }
      });
      this.ghost.add(m);
      this.ghost.userData.type = type;
    }
    this.ghost.traverse((o) => {
      if (o instanceof T.Mesh)
        (o.material as T.MeshBasicMaterial).color.set(
          valid ? (snapped ? "#a4dfbe" : "#e4d29b") : "#ce6c54",
        );
    });
    this.ghost.position.set(x, -0.08, z);
  }
  update(world: VisualWorld, selected: string[], realTime: number) {
    for (const impact of this.ballistaImpacts.update(world))
      this.burstImpact(
        new T.Vector3(impact.x, impact.y, impact.z),
        impact.wood,
        0.65,
      );
    const turnDt =
      this.lastRenderTime === undefined
        ? 1 / 60
        : Math.min(0.1, Math.max(0, realTime - this.lastRenderTime));
    this.lastRenderTime = realTime;
    const surfaces = new Map<string, number>();
    const fortTiles = new Set<string>();
    const channels = new Set<string>();
    const clearedBanks = new Set<string>();
    for (const entity of Object.values(world.entities)) {
      if (entity.hp <= 0) continue;
      const key = `${Math.round(entity.x)},${Math.round(entity.z)}`;
      if (entity.channel || ["canal", "trench", "ravine"].includes(entity.type))
        channels.add(key);
      if (
        channels.has(key) ||
        ["bridge", "dock"].includes(
          buildingDefs[entity.type]?.behavior || entity.type,
        )
      )
        clearedBanks.add(key);
      if (
        entity.kind === "building" &&
        ["wall", "gate"].includes(
          buildingDefs[entity.type]?.behavior || entity.type,
        )
      )
        fortTiles.add(`${entity.x},${entity.z}`);
      if (
        entity.kind === "building" &&
        ((buildingDefs[entity.type]?.behavior || entity.type) === "road" ||
          ((buildingDefs[entity.type]?.behavior || entity.type) === "bridge" &&
            entity.open))
      )
        surfaces.set(
          `${Math.round(entity.x)},${Math.round(entity.z)}`,
          (buildingDefs[entity.type]?.behavior || entity.type) === "bridge"
            ? 0.105
            : -0.03,
        );
    }
    const bankSignature = [...clearedBanks].sort().join("|");
    if (bankSignature !== this.bankSignature) {
      this.bankSignature = bankSignature;
      const hidden = new T.Matrix4().makeScale(0, 0, 0);
      for (const { mesh, matrices, positions } of this.bankInstances) {
        positions.forEach((p, i) => {
          const covered = [-0.3, 0, 0.3].some((dx) =>
            [-0.3, 0, 0.3].some((dz) =>
              clearedBanks.has(
                `${Math.round(p.x + dx)},${Math.round(p.z + dz)}`,
              ),
            ),
          );
          mesh.setMatrixAt(i, covered ? hidden : matrices[i]);
        });
        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingSphere();
      }
    }
    const appearance = (world.addons as { appearance?: Appearance } | undefined)
      ?.appearance;
    const roofMembers = new Set<string>();
    const buildings = Object.values(world.entities).filter(
      (e) =>
        e.kind === "building" &&
        e.hp > 0 &&
        e.joined &&
        [
          "house",
          "warehouse",
          "lumber",
          "lumbermill",
          "farm",
          "market",
          "barracks",
          "forge",
          "hospital",
          "stable",
          "quarry",
          "mill",
          "dock",
          "port",
        ].includes(buildingDefs[e.type]?.behavior || e.type),
    );
    const roofGroups: {
      ids: string[];
      x: number;
      z: number;
      width: number;
      depth: number;
    }[] = [];
    const visited = new Set<string>();
    for (const start of buildings) {
      if (visited.has(start.id)) continue;
      const group = [start];
      visited.add(start.id);
      for (let i = 0; i < group.length; i++)
        for (const next of buildings)
          if (
            !visited.has(next.id) &&
            group[i].links?.includes(next.id) &&
            touching(group[i], next)
          ) {
            visited.add(next.id);
            group.push(next);
          }
      if (group.length < 2) continue;
      const bounds = group.map((e) => ({
        ...e,
        ...footprint(e.type, e.rotation),
      }));
      const minX = Math.min(...bounds.map((e) => e.x - e.width / 2)),
        maxX = Math.max(...bounds.map((e) => e.x + e.width / 2));
      const minZ = Math.min(...bounds.map((e) => e.z - e.depth / 2)),
        maxZ = Math.max(...bounds.map((e) => e.z + e.depth / 2));
      if (
        Math.abs(
          (maxX - minX) * (maxZ - minZ) -
            bounds.reduce((sum, e) => sum + e.width * e.depth, 0),
        ) > 0.02
      )
        continue;
      group.forEach((e) => roofMembers.add(e.id));
      roofGroups.push({
        ids: group.map((e) => e.id),
        x: (minX + maxX) / 2,
        z: (minZ + maxZ) / 2,
        width: maxX - minX,
        depth: maxZ - minZ,
      });
    }
    const roofSignature = JSON.stringify(roofGroups);
    if (roofSignature !== this.complexRoofSignature) {
      this.complexRoofSignature = roofSignature;
      this.disposeModel(this.complexRoofs);
      this.complexRoofs.clear();
      if (!this.complexRoofs.parent) this.scene.add(this.complexRoofs);
      for (const r of roofGroups) {
        const g = new T.Group();
        g.position.set(r.x, -0.08, r.z);
        g.userData.entityId = r.ids[0];
        this.complexRoofs.add(g);
        const w = Math.max(r.width, r.depth),
          d = Math.min(r.width, r.depth);
        if (r.depth > r.width) g.rotation.y = Math.PI / 2;
        roof(g, w, d, 1.4 + w * 0.22, palette.roof, d * 0.65);
      }
    }
    const wallPosts = Object.values(world.entities).filter((e) =>
      isWallPost(e),
    ) as WallPost[];
    const rampSignature = JSON.stringify(
      wallPosts.map((e) => [e.id, e.type, e.x, e.z, e.rotation]),
    );
    if (rampSignature !== this.wallRampSignature) {
      this.wallRampSignature = rampSignature;
      this.disposeModel(this.wallRamps);
      this.wallRamps.clear();
      if (!this.wallRamps.parent) this.scene.add(this.wallRamps);
      for (let i = 0; i < wallPosts.length; i++)
        for (let j = i + 1; j < wallPosts.length; j++) {
          const a = wallPosts[i],
            b = wallPosts[j];
          if (!wallConnected(a, b, wallPosts)) continue;
          const p = wallStandingPose(a, wallPosts),
            q = wallStandingPose(b, wallPosts),
            dy = q.floor - p.floor;
          if (Math.abs(dy) < 0.04) continue;
          const dx = q.x - p.x,
            dz = q.z - p.z,
            d = Math.hypot(dx, dz),
            angle = Math.atan2(dy, d);
          const ramp = box(
            this.wallRamps,
            "#8d6c43",
            (p.x + q.x) / 2,
            (p.floor + q.floor) / 2 - 0.04 / Math.cos(angle),
            (p.z + q.z) / 2,
            0.38,
            0.08,
            Math.hypot(d, dy),
          );
          ramp.rotation.set(-angle, Math.atan2(dx, dz), 0, "YXZ");
          ramp.userData.entityId = a.id;
          for (const t of [0.25, 0.75]) {
            const height = p.floor + dy * t;
            box(
              this.wallRamps,
              "#5e4b32",
              p.x + dx * t,
              (height - 0.08) / 2,
              p.z + dz * t,
              0.07,
              height + 0.08,
              0.07,
            );
          }
        }
    }
    const removedRoads = new Set((world.removedRoads as string[]) || []);
    const builtRoads = new Set(
      Object.values(world.entities)
        .filter(
          (e) =>
            e.kind === "building" &&
            (buildingDefs[e.type]?.behavior || e.type) === "road",
        )
        .map((e) => roadKey(e.x, e.z)),
    );
    for (const [key, tile] of this.basePathTiles)
      tile.visible = !removedRoads.has(key) && !builtRoads.has(key);
    const now = performance.now();
    this.frameCount++;
    if (now - this.fpsStart > 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.fpsStart));
      this.frameCount = 0;
      this.fpsStart = now;
    }
    for (const [id, g] of this.objects) {
      if (!world.entities[id] || world.entities[id].hp <= 0) {
        this.root.remove(g);
        this.disposeModel(g);
        this.objects.delete(id);
        this.rings.get(id)?.removeFromParent();
        this.rings.delete(id);
        this.last.delete(id);
      }
    }
    for (const e of Object.values(world.entities)) {
      if (e.hp <= 0) continue;
      let visual = roofMembers.has(e.id) ? { ...e, sharedRoof: true } : e;
      if (e.faction === "player" && appearance)
        visual = {
          ...visual,
          outfit: appearance.outfit,
          dogColor: appearance.dogColor,
          bannerColor: appearance.bannerColor,
          bannerEmblem: appearance.bannerEmblem,
        };
      if (["canal", "trench", "ravine"].includes(e.type)) {
        let edges = 0;
        for (const [bit, dx, dz] of [
          [1, -1, 0],
          [2, 1, 0],
          [4, 0, -1],
          [8, 0, 1],
        ]) {
          const x = Math.round(e.x) + dx,
            z = Math.round(e.z) + dz;
          if (!channels.has(`${x},${z}`) && !(x >= 31 && x <= 33)) edges |= bit;
        }
        visual = { ...e, channelEdges: edges };
      }
      if (e.type === "wallStairs") {
        const heights = Object.values(world.entities)
          .filter(
            (p) =>
              p.kind === "building" &&
              p.faction === e.faction &&
              ["wall", "tower"].includes(
                buildingDefs[p.type]?.behavior || p.type,
              ) &&
              Math.hypot(p.x - e.x, p.z - e.z) <= 1.7,
          )
          .map((p) => fortificationSurface(p.type).height);
        visual = {
          ...visual,
          stairsHeight: heights.length ? Math.max(...heights) : 1.3,
        };
      }
      const family = buildingDefs[e.type]?.behavior || e.type;
      if (e.kind === "building" && ["wall", "gate"].includes(family)) {
        const horizontal =
          fortTiles.has(`${e.x - 1},${e.z}`) ||
          fortTiles.has(`${e.x + 1},${e.z}`);
        const vertical =
          fortTiles.has(`${e.x},${e.z - 1}`) ||
          fortTiles.has(`${e.x},${e.z + 1}`);
        visual = {
          ...visual,
          wallAxis: horizontal
            ? vertical && family === "wall"
              ? 2
              : 1
            : vertical
              ? 0
              : undefined,
        };
      }
      if ((buildingDefs[e.type]?.behavior || e.type) === "bridge") {
        const group = connectedBridgeGroup(Object.values(world.entities), e);
        visual = { ...e, span: group[0].id === e.id ? group.length : 0 };
      }
      const shape = [
        e.kind,
        e.type,
        e.faction,
        visual.span,
        visual.wallAxis,
        visual.channelEdges,
        visual.sharedRoof,
        visual.stairsHeight,
        e.rotation,
        visual.outfit,
        visual.dogColor,
        visual.bannerColor,
        visual.bannerEmblem,
        e.kind === "building" && ["wall", "gate"].includes(family)
          ? damageStage(e.hp, e.maxHp)
          : 0,
        e.lastDamageKind === "ballistaTower" && e.hp < e.maxHp,
      ].join("|");
      let g = this.objects.get(e.id);
      if (!g || g.userData.shape !== shape) {
        if (g) {
          const stage = damageStage(e.hp, e.maxHp);
          if (
            e.kind === "building" &&
            ["wall", "gate"].includes(family) &&
            stage > Number(g.userData.damageStage ?? stage)
          )
            this.onFortificationSound?.(
              "crack",
              buildingDefs[e.type]?.material === "wood",
              e,
            );
          const collapse = e.siegeCollapse as
            { time: number; by: string } | undefined;
          if (
            e.kind === "ruin" &&
            collapse &&
            Number(world.time) - collapse.time < 1 &&
            !this.collapses.some((c) => c.id === e.id)
          ) {
            this.collapses.push({
              id: e.id,
              model: g,
              start:
                realTime +
                (collapse.by === "ballistaTower"
                  ? Math.max(0, 0.45 - (Number(world.time) - collapse.time)) /
                    Number(world.speed || 1)
                  : collapse.by === "catapult"
                    ? 0.55 + 0.18 / Number(world.speed || 1)
                    : 0.3 / Number(world.speed || 1)),
              origin: g.position.clone(),
              wood: buildingDefs[String(e.originalType)]?.material === "wood",
              burst: false,
            });
          } else {
            this.root.remove(g);
            this.disposeModel(g);
          }
        }
        g =
          ["soldier", "archer", "enemy"].includes(e.kind) &&
          !["ram", "catapult"].includes(e.type)
            ? new T.Group()
            : this.make(visual);
        if (e.kind === "building")
          g.rotation.y = ((e.rotation ?? 0) * Math.PI) / 2;
        if (visual.wallAxis === 0 && e.rotation === undefined) g.rotation.y = 0;
        if (visual.wallAxis === 1 && e.rotation === undefined)
          g.rotation.y = Math.PI / 2;
        if (visual.wallAxis === 2) {
          const cross = this.make(e);
          cross.rotation.y = Math.PI / 2;
          g.add(cross);
        }
        if (e.faction === "player" && appearance) {
          g.traverse((o) => {
            if (!(o instanceof T.Mesh) || !o.userData.flag) return;
            o.material = mat(bannerColors[appearance.bannerColor][1]);
            const emblem = new T.Group();
            emblem.position.set(0, 0, 0.026);
            o.add(emblem);
            const color = "#f2e4b6";
            if (appearance.bannerEmblem === "star")
              mesh(new T.IcosahedronGeometry(0.09, 0), color, emblem);
            else if (appearance.bannerEmblem === "moon") {
              const crescent = mesh(
                new T.TorusGeometry(0.075, 0.023, 4, 10, Math.PI * 1.5),
                color,
                emblem,
              );
              crescent.rotation.z = 0.5;
            } else if (appearance.bannerEmblem === "tree") {
              mesh(
                new T.ConeGeometry(0.08, 0.16, 3),
                color,
                emblem,
                0,
                0.025,
                0,
              );
              box(emblem, color, 0, -0.07, 0, 0.025, 0.06, 0.025);
            } else {
              box(emblem, color, 0, 0.015, 0, 0.025, 0.18, 0.025);
              box(emblem, color, 0, -0.04, 0, 0.11, 0.025, 0.025);
            }
          });
        }
        g.userData.damageStage = damageStage(e.hp, e.maxHp);
        g.userData.entityId = e.id;
        g.userData.shape = shape;
        this.objects.set(e.id, g);
        this.root.add(g);
        g.position.set(e.x, 0, e.z);
      }
      const old = this.last.get(e.id) || new T.Vector3(e.x, 0, e.z),
        dx = e.x - old.x,
        dz = e.z - old.z,
        moving = Math.hypot(dx, dz) > 0.00005;
      const carrier =
        typeof e.carriedBy === "string"
          ? world.entities[e.carriedBy]
          : undefined;
      const mounted = typeof e.mountedOn === "string";
      const onVillagePath =
        villageRoadTiles.has(roadKey(e.x, e.z)) &&
        !removedRoads.has(roadKey(e.x, e.z));
      const mobile = [
        "hero",
        "worker",
        "soldier",
        "archer",
        "enemy",
        "dog",
        "horse",
        "caravan",
        "merchant",
      ].includes(e.kind);
      const groundHeight =
        e.kind === "boat" || carrier?.kind === "boat"
          ? -0.04
          : mobile
            ? (surfaces.get(`${Math.round(e.x)},${Math.round(e.z)}`) ??
              (onVillagePath ? 0.015 : -0.08))
            : -0.08;
      const postId = (e.garrisonId || e.garrisonTargetId) as string | undefined,
        post = postId ? world.entities[postId] : undefined;
      const yaw = post
        ? (this.objects.get(post.id)?.rotation.y ??
          ((post.rotation ?? 0) * Math.PI) / 2)
        : 0;
      const support =
        (e.wallWalk
          ? wallWalkingPose(e.wallWalk as WallWalk, wallPosts)
          : undefined) ||
        supportedPose(
          { x: e.x, z: e.z, elevation: Number(e.elevation || 0) },
          post,
          groundHeight,
          yaw,
        );
      let visualX = support.x,
        visualZ = support.z;
      if (post?.type === "bastion" && !e.wallWalk) {
        const occupants = Object.values(world.entities)
          .filter(
            (u) => u.garrisonId === post.id || u.garrisonTargetId === post.id,
          )
          .sort((a, b) => a.id.localeCompare(b.id));
        const offset = [
          [-0.5, -0.35],
          [0.5, -0.35],
          [0, 0.4],
        ][
          Math.max(
            0,
            occupants.findIndex((u) => u.id === e.id),
          )
        ] || [0, 0];
        visualX += offset[0] * Number(e.elevation || 0);
        visualZ += offset[1] * Number(e.elevation || 0);
      }
      if (
        carrier?.type === "transportBoat" &&
        Array.isArray(carrier.passengerIds)
      ) {
        const index = carrier.passengerIds.indexOf(e.id),
          yaw = this.objects.get(carrier.id)?.rotation.y || 0;
        if (index >= 0) {
          const [x, z] = [
            [-0.5, 0.2],
            [0.1, -0.22],
            [0.55, 0.2],
          ][index];
          visualX += x * Math.cos(yaw) + z * Math.sin(yaw);
          visualZ += -x * Math.sin(yaw) + z * Math.cos(yaw);
        }
      }
      const human = ["hero", "worker", "soldier", "archer", "enemy"].includes(
        e.kind,
      );
      const height =
        support.floor +
        (human ? 0.02 : 0) +
        (mounted ? 0.8 : 0) +
        (carrier?.kind === "boat" ? 0.28 : 0);
      const stationed =
        (!!e.wallWalk || !!e.garrisonId) &&
        Number(e.elevation ?? 0) >= 1 &&
        !e.descending;
      if (e.kind === "building" || stationed)
        g.position.set(visualX, height, visualZ);
      else g.position.lerp(new T.Vector3(visualX, height, visualZ), 0.4);
      if (e.kind === "tree" && typeof e.growth === "number")
        g.scale.setScalar(0.2 + 0.8 * Math.min(1, e.growth / 60));
      if (e.kind === "boat") {
        if (moving) g.userData.boatHeading = boatHeading(dx, dz);
        if (typeof g.userData.boatHeading === "number")
          g.rotation.y = turnBoat(g.rotation.y, g.userData.boatHeading, turnDt);
      } else if (moving && !["building", "tree", "rock"].includes(e.kind))
        g.rotation.y = Math.atan2(dx, dz);
      g.visible = !this.collapses.some((c) => c.id === e.id);
      if (e.kind === "horse" && carrier) {
        g.rotation.y = this.objects.get(carrier.id)?.rotation.y ?? g.rotation.y;
      }
      if (g.userData.cartWheels && moving)
        for (const wheel of g.userData.cartWheels as T.Group[])
          wheel.rotation.x = realTime * 5;
      if (
        e.kind === "building" &&
        Number(e.fire || 0) > 0 &&
        !g.userData.flames
      ) {
        const flames = new T.Group();
        g.add(flames);
        g.userData.flames = flames;
        for (let i = 0; i < 5; i++) {
          const flame = new T.Mesh(
            new T.ConeGeometry(0.18, 0.85, 5),
            new T.MeshBasicMaterial({ color: i % 2 ? "#f4c85e" : "#d96d32" }),
          );
          flame.position.set(
            Math.sin(i * 2) * 0.5,
            2.0 + i * 0.18,
            Math.cos(i * 2) * 0.4,
          );
          flames.add(flame);
        }
      }
      if (g.userData.flames) {
        const flames = g.userData.flames as T.Group;
        flames.visible = e.kind === "building" && Number(e.fire || 0) > 0;
        flames.children.forEach((flame, i) => {
          flame.scale.y = 0.8 + Math.sin(realTime * 12 + i * 2) * 0.25;
        });
      }
      const fireTarget = world.entities[String(e.fireTargetId || "")];
      const spraying =
        fireTarget &&
        Number(fireTarget.fire || 0) > 0 &&
        Math.hypot(e.x - fireTarget.x, e.z - fireTarget.z) <= 1.8;
      if (spraying && !g.userData.spray) {
        const spray = new T.Group();
        g.add(spray);
        g.userData.spray = spray;
        for (let i = 0; i < 10; i++) sphere(spray, "#9cdbdc", 0, 0, 0, 0.055);
        const bucket = cyl(g, "#987148", 0.34, 0.36, 0.16, 0.12, 0.23, 8);
        g.userData.fireBucket = bucket;
      }
      if (g.userData.spray) {
        const spray = g.userData.spray as T.Group;
        spray.visible = !!spraying;
        (g.userData.fireBucket as T.Mesh).visible = !!spraying;
        if (spraying) {
          const delta = new T.Vector3(
            fireTarget.x - g.position.x,
            0,
            fireTarget.z - g.position.z,
          ).applyAxisAngle(new T.Vector3(0, 1, 0), -g.rotation.y);
          spray.children.forEach((drop, i) => {
            const t = (realTime * 1.8 + i / 10) % 1;
            drop.position.set(
              delta.x * t,
              0.7 + 1.6 * t + 2.2 * t * (1 - t),
              delta.z * t,
            );
          });
        }
      }
      if (g.userData.ballista) {
        const turret = g.userData.ballista as T.Group,
          attack = e.lastAttack as
            | { time: number; x: number; z: number; targetId?: string }
            | undefined;
        const bolt = g.userData.bolt as T.Mesh;
        const age = attack ? world.time - attack.time : 100;
        bolt.visible = age >= 0 && age < 0.45;
        if (attack) {
          const live = world.entities[attack.targetId || ""];
          const target = live?.hp > 0 ? live : attack;
          const heading =
            Math.atan2(target.x - e.x, target.z - e.z) - g.rotation.y;
          turret.rotation.y = turnBallista(turret.rotation.y, heading, turnDt);
          // A fired bolt keeps its own trajectory while the weapon continues turning.
          if (bolt.parent !== g) {
            g.add(bolt);
            bolt.position.y = turret.position.y + 0.38;
          }
          const shotHeading =
            Math.atan2(attack.x - e.x, attack.z - e.z) - g.rotation.y;
          const distance =
            0.5 +
            (Math.max(0, age) / 0.45) *
              Math.hypot(attack.x - e.x, attack.z - e.z);
          bolt.rotation.y = shotHeading;
          bolt.position.x = Math.sin(shotHeading) * distance;
          bolt.position.z = Math.cos(shotHeading) * distance;
        }
      }
      if (g.userData.gateDoor)
        (g.userData.gateDoor as T.Group).position.y = T.MathUtils.lerp(
          (g.userData.gateDoor as T.Group).position.y,
          e.open ? 1.7 : 0,
          0.08,
        );
      if (g.userData.draftHorse) {
        const horse = g.userData.draftHorse as T.Group;
        const stride = moving ? 0.48 : 0;
        for (const leg of horse.userData.draftLegs as T.Group[])
          leg.rotation.x = T.MathUtils.lerp(
            leg.rotation.x,
            Math.sin(realTime * 9 + Number(leg.userData.phase)) * stride,
            0.25,
          );
        (horse.userData.tail as T.Mesh).rotation.z =
          Math.sin(realTime * 4) * (moving ? 0.22 : 0.08);
      }
      if (g.userData.legs) {
        for (const leg of (g.userData.legs as T.Group).children)
          leg.rotation.x = mounted
            ? -1.1
            : moving
              ? Math.sin(realTime * 10) *
                (Number(leg.userData.leg) > 0 ? 1 : -1) *
                0.45
              : 0;
      }
      if (g.userData.tail)
        (g.userData.tail as T.Mesh).rotation.z = Math.sin(realTime * 5) * 0.3;
      if (g.userData.cape)
        (g.userData.cape as T.Mesh).rotation.x =
          -0.2 + Math.sin(realTime * 3) * 0.08;
      if (g.userData.wheel)
        (g.userData.wheel as T.Group).rotation.z = realTime * 0.6;
      if (g.userData.sails)
        (g.userData.sails as T.Group).rotation.z = realTime * 0.4;
      if (g.userData.deck) {
        const d = g.userData.deck as T.Group;
        d.rotation.z = T.MathUtils.lerp(
          d.rotation.z,
          e.open === false ? Math.PI * 0.45 : 0,
          0.06,
        );
      }
      if (g.userData.waterDoor)
        (g.userData.waterDoor as T.Group).position.y = T.MathUtils.lerp(
          (g.userData.waterDoor as T.Group).position.y,
          e.open ? 2.7 : -0.08,
          0.1,
        );
      if (g.userData.signalFire) {
        const fire = g.userData.signalFire as T.Group;
        fire.visible =
          Number(world.raidTimer) <= 180 ||
          Object.values(world.entities).some(
            (v) =>
              v.faction === "enemy" && Math.hypot(v.x - e.x, v.z - e.z) <= 14,
          );
        fire.scale.y = 1 + Math.sin(realTime * 7) * 0.035;
      }
      if (g.userData.door) {
        const d = g.userData.door as T.Mesh;
        d.position.y = T.MathUtils.lerp(
          d.position.y,
          0.85 + (e.open ? 1.4 : 0),
          0.08,
        );
      }
      if (e.kind === "boat") g.position.y = boatHeight(height, realTime);
      if (["ram", "catapult"].includes(e.type)) {
        const attack = e.lastAttack as
          { time: number; x: number; z: number } | undefined;
        const age = attack ? Number(world.time) - attack.time : 2;
        const pose = siegePose(age);
        if (g.userData.ramBeam)
          (g.userData.ramBeam as T.Group).position.z = pose.ram;
        if (g.userData.siegeArm)
          (g.userData.siegeArm as T.Group).rotation.x = pose.arm;
        if (g.userData.loadedStone)
          (g.userData.loadedStone as T.Mesh).visible = pose.loaded;
        if (attack && age < 1)
          g.rotation.y = Math.atan2(attack.x - e.x, attack.z - e.z);
        if (
          attack &&
          g.userData.siegeShot !== attack.time &&
          age >= (e.type === "ram" ? 0.3 : 0.18) &&
          age < 0.95
        ) {
          g.userData.siegeShot = attack.time;
          const stone = e.type === "catapult";
          const target =
            world.entities[(e.lastAttack as { targetId: string }).targetId];
          const structural =
            target && ["building", "town", "ruin"].includes(target.kind);
          const wood =
            !!target &&
            buildingDefs[String(target.originalType || target.type)]
              ?.material === "wood";
          const direction = new T.Vector3(
            attack.x - e.x,
            0,
            attack.z - e.z,
          ).normalize();
          const to = new T.Vector3(
            attack.x,
            stone ? 0.7 : 0.8,
            attack.z,
          ).addScaledVector(direction, -0.45);
          if (!stone) {
            if (structural) this.burstImpact(to, wood, 0.8);
          } else {
            const shot = new T.Mesh(
              new T.IcosahedronGeometry(0.18, 1),
              new T.MeshBasicMaterial({ color: "#a6aa95" }),
            );
            const from = new T.Vector3(e.x, height + 1.8, e.z);
            shot.position.copy(from);
            this.scene.add(shot);
            this.effects.push({
              mesh: shot,
              start: realTime,
              from,
              to,
              life: 0.55,
              arc: 1.7,
              impact: structural ? { wood, strength: 1.15 } : undefined,
            });
          }
        }
      }
      if (
        !["ram", "catapult", "ballistaTower"].includes(e.type) &&
        Number(e.cooldown) > Number(g.userData.cooldown ?? 1) + 0.3
      ) {
        const opponents = Object.values(world.entities).filter(
          (v) =>
            v.hp > 0 &&
            (e.faction === "enemy"
              ? v.faction === "player"
              : v.faction === "enemy"),
        );
        const target = opponents.sort(
          (a, b) =>
            Math.hypot(a.x - e.x, a.z - e.z) - Math.hypot(b.x - e.x, b.z - e.z),
        )[0];
        if (target && this.effects.length < 100) {
          const from = new T.Vector3(e.x, height + 0.8, e.z),
            to = new T.Vector3(target.x, 0.7, target.z);
          const arrow =
            e.kind === "archer" ||
            (buildingDefs[e.type]?.behavior || e.type) === "tower" ||
            e.type === "catapult";
          const spark = new T.Mesh(
            arrow
              ? new T.ConeGeometry(0.045, 0.45, 4)
              : new T.IcosahedronGeometry(0.09, 0),
            new T.MeshBasicMaterial({ color: arrow ? "#f3ddb0" : "#f9d28b" }),
          );
          spark.position.copy(from);
          if (arrow)
            spark.quaternion.setFromUnitVectors(
              new T.Vector3(0, 1, 0),
              to.clone().sub(from).normalize(),
            );
          this.scene.add(spark);
          this.effects.push({
            mesh: spark,
            start: realTime,
            from,
            to,
            life: arrow ? 0.35 : 0.15,
          });
          if (e.kind !== "building")
            g.rotation.y = Math.atan2(target.x - e.x, target.z - e.z);
        }
      }
      g.userData.cooldown = e.cooldown;
      const isSelected = selected.includes(e.id);
      let ring = this.rings.get(e.id);
      if (isSelected && !ring) {
        ring = new T.Mesh(
          new T.RingGeometry(
            e.kind === "building" ? 1.15 : 0.46,
            e.kind === "building" ? 1.23 : 0.52,
            40,
          ),
          new T.MeshBasicMaterial({
            color: "#f5d68c",
            transparent: true,
            opacity: 0.9,
            depthWrite: false,
            side: T.DoubleSide,
          }),
        );
        ring.rotation.x = -Math.PI / 2;
        this.scene.add(ring);
        this.rings.set(e.id, ring);
      }
      if (ring) {
        ring.visible = isSelected && g.visible;
        ring.position.set(visualX, support.floor + 0.012, visualZ);
      }
      this.last.set(e.id, new T.Vector3(e.x, 0, e.z));
    }
    const flooded = new Set((world.floodedTiles as string[] | undefined) || []);
    for (const [key, m] of this.channelWater)
      if (!flooded.has(key)) {
        m.removeFromParent();
        m.geometry.dispose();
        this.channelWater.delete(key);
      }
    for (const key of flooded)
      if (!this.channelWater.has(key)) {
        const [x, z] = key.split(",").map(Number);
        const m = new T.Mesh(new T.PlaneGeometry(1, 1), this.water.material);
        m.rotation.x = -Math.PI / 2;
        m.position.set(x, -0.04, z);
        m.receiveShadow = true;
        this.scene.add(m);
        this.channelWater.set(key, m);
      }
    this.updateCrowds(world, realTime);
    this.effects = this.effects.filter((f) => {
      const t = (realTime - f.start) / f.life;
      if (t >= 1) {
        if (f.impact) this.burstImpact(f.to, f.impact.wood, f.impact.strength);
        f.mesh.removeFromParent();
        f.mesh.geometry.dispose();
        (f.mesh.material as T.Material).dispose();
        return false;
      }
      f.mesh.position.lerpVectors(f.from, f.to, t);
      f.mesh.position.y += Math.sin(t * Math.PI) * (f.arc ?? 0.35);
      return true;
    });
    this.collapses = this.collapses.filter((c) => {
      const age = realTime - c.start;
      if (age < 0) return true;
      if (!c.burst) {
        this.burstImpact(c.origin.clone().setY(0.5), c.wood, 1.8);
        this.onFortificationSound?.("collapse", c.wood, {
          x: c.origin.x,
          z: c.origin.z,
        });
        c.burst = true;
      }
      const pose = collapsePose(age);
      c.model.position.y = c.origin.y - pose.sink;
      c.model.rotation.z = pose.tilt;
      c.model.scale.y = pose.scale;
      if (pose.done) {
        c.model.removeFromParent();
        this.disposeModel(c.model);
        const ruin = this.objects.get(c.id);
        if (ruin) ruin.visible = true;
        return false;
      }
      return true;
    });
    this.impactBits = this.impactBits.filter((bit) => {
      const age = realTime - bit.start,
        pose = impactPose(bit.particle, age);
      if (pose.done) {
        bit.mesh.removeFromParent();
        (bit.mesh.material as T.Material).dispose();
        return false;
      }
      bit.mesh.position.set(
        bit.origin.x + pose.x * bit.strength,
        Math.max(-0.04, bit.origin.y + pose.y),
        bit.origin.z + pose.z * bit.strength,
      );
      (bit.mesh.material as T.MeshStandardMaterial).opacity = pose.opacity;
      if (bit.particle.dust)
        bit.mesh.scale.setScalar(bit.particle.size * pose.scale * bit.strength);
      else {
        bit.mesh.rotation.x += turnDt * 4;
        bit.mesh.rotation.z += turnDt * 3;
      }
      return true;
    });
    this.ripples.children.forEach((r, i) => {
      r.position.x =
        31.25 + rand(i, 3) * 1.5 + Math.sin(realTime * 0.6 + i) * 0.13;
      r.position.z = (i * 0.8 + realTime * 0.15) % 64;
    });
    this.renderer.render(this.scene, this.camera);
  }
  private updateCrowds(world: VisualWorld, time: number) {
    const groups = new Map<string, VisualEntity[]>();
    for (const e of Object.values(world.entities)) {
      if (
        !["soldier", "archer", "enemy"].includes(e.kind) ||
        ["ram", "catapult"].includes(e.type) ||
        e.hp <= 0
      )
        continue;
      const key = e.kind + e.type + e.faction;
      const list = groups.get(key) || [];
      list.push(e);
      groups.set(key, list);
    }
    for (const [key, meshes] of this.crowds)
      if (!groups.has(key)) meshes.forEach((m) => (m.count = 0));
    for (const [key, entities] of groups) {
      let meshes = this.crowds.get(key);
      if (!meshes) {
        const sample = ["ram", "catapult"].includes(entities[0].type)
          ? siegeEngine(entities[0])
          : human(entities[0]);
        sample.updateMatrixWorld(true);
        const materialGroups = new Map<T.Material, T.BufferGeometry[]>();
        sample.traverse((o) => {
          if (o instanceof T.Mesh && !Array.isArray(o.material)) {
            const list = materialGroups.get(o.material) || [];
            const geo = o.geometry.clone().applyMatrix4(o.matrixWorld);
            list.push(geo.index ? geo.toNonIndexed() : geo);
            materialGroups.set(o.material, list);
          }
        });
        meshes = [];
        for (const [material, geometries] of materialGroups) {
          const geometry = mergeGeometries(geometries);
          if (geometry) {
            const m = new T.InstancedMesh(geometry, material, 2048);
            m.castShadow = true;
            m.receiveShadow = true;
            m.frustumCulled = false;
            this.scene.add(m);
            meshes.push(m);
          }
          geometries.forEach((g) => g.dispose());
        }
        this.crowds.set(key, meshes);
      }
      const ids = entities.map((e) => e.id);
      for (const m of meshes) {
        m.count = entities.length;
        m.userData.ids = ids;
      }
      for (let i = 0; i < entities.length; i++) {
        const e = entities[i],
          g = this.objects.get(e.id)!;
        this.dummy.position.copy(g.position);
        const moving = !!(e.order as { path?: unknown[] } | undefined)?.path
          ?.length;
        if (moving)
          this.dummy.position.y += Math.abs(Math.sin(time * 9 + i)) * 0.035;
        this.dummy.rotation.copy(g.rotation);
        this.dummy.scale.set(1, 1, 1);
        this.dummy.updateMatrix();
        for (const m of meshes) m.setMatrixAt(i, this.dummy.matrix);
      }
      for (const m of meshes) m.instanceMatrix.needsUpdate = true;
    }
  }
  private disposeModel(g: T.Group) {
    g.traverse((o) => {
      if (o instanceof T.Mesh) o.geometry.dispose();
    });
  }
  private make(e: VisualEntity) {
    if (e.kind === "building") return damageFortification(building(e), e);
    if (["ram", "catapult"].includes(e.type)) return siegeEngine(e);
    if (["hero", "worker", "soldier", "archer", "enemy"].includes(e.kind))
      return human(e);
    if (["dog", "horse", "camel"].includes(e.kind)) return animal(e);
    if (e.kind === "boat") {
      const hull = boat();
      if (e.type === "transportBoat") {
        hull.scale.setScalar(1.25);
        for (const z of [-0.44, 0.44])
          box(hull, "#416c70", 0, 0.25, z, 1.35, 0.12, 0.025);
      }
      return hull;
    }
    if (e.kind === "tree") return tree(e);
    if (e.kind === "caravan" || e.kind === "merchant") {
      const g = new T.Group();
      const wood = "#a47b4c",
        iron = "#414a43";
      // Open plank wagon, with a high canvas hood over the cargo only.
      box(g, palette.beam, 0, 0.38, 0, 1, 0.15, 1.55);
      for (let i = 0; i < 7; i++)
        box(g, wood, 0, 0.49, -0.66 + i * 0.22, 1.04, 0.07, 0.205);
      for (const x of [-0.51, 0.51]) {
        for (const y of [0.64, 0.83])
          box(g, wood, x, y, -0.2, 0.07, 0.16, 1.15);
        for (const z of [-0.73, 0.3])
          box(g, palette.beam, x, 0.73, z, 0.09, 0.62, 0.09);
      }
      box(g, wood, 0, 0.74, -0.74, 1.06, 0.45, 0.07);
      const canvas = e.tradeRoute ? "#6f8b68" : "#d9cba1";
      // Faceted barrel-shaped canopy, open at both ends.
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI,
          b = ((i + 1) / 8) * Math.PI;
        const x1 = Math.cos(a) * 0.57,
          y1 = 1.04 + Math.sin(a) * 0.48;
        const x2 = Math.cos(b) * 0.57,
          y2 = 1.04 + Math.sin(b) * 0.48;
        const panel = box(
          g,
          i % 2 ? canvas : "#e7d8b2",
          (x1 + x2) / 2,
          (y1 + y2) / 2,
          -0.22,
          Math.hypot(x2 - x1, y2 - y1) + 0.015,
          0.035,
          1.18,
        );
        panel.rotation.z = Math.atan2(y2 - y1, x2 - x1);
      }
      for (const x of [-0.55, 0.55])
        for (const z of [-0.78, 0.34])
          box(g, palette.beam, x, 0.84, z, 0.045, 0.43, 0.045);
      // Crates and sacks remain visible through the open back.
      box(g, "#b58d54", -0.23, 0.69, -0.48, 0.4, 0.34, 0.4);
      for (const x of [-0.39, -0.07])
        box(g, iron, x, 0.69, -0.695, 0.035, 0.35, 0.025);
      sphere(g, "#c2af7f", 0.24, 0.71, -0.47, 0.23, 0.85, 1, 1);
      box(g, palette.beam, 0, 0.7, 0.58, 0.95, 0.1, 0.26);
      const trader = human({ ...e, kind: "worker", driving: true });
      trader.scale.setScalar(0.62);
      trader.position.set(0, 0.55, 0.57);
      g.add(trader);
      const wheels: T.Group[] = [];
      for (const x of [-0.59, 0.59])
        for (const z of [-0.5, 0.53]) {
          const wheel = new T.Group();
          wheel.position.set(x, 0.3, z);
          const rim = mesh(
            new T.TorusGeometry(0.26, 0.045, 4, 12),
            palette.beam,
            wheel,
          );
          rim.rotation.y = Math.PI / 2;
          for (let i = 0; i < 6; i++) {
            const spoke = box(wheel, wood, 0, 0, 0, 0.045, 0.49, 0.045);
            spoke.rotation.x = (i * Math.PI) / 6;
          }
          const hub = cyl(wheel, iron, 0, 0, 0, 0.075, 0.13, 8);
          hub.rotation.z = Math.PI / 2;
          g.add(wheel);
          wheels.push(wheel);
        }
      g.userData.cartWheels = wheels;
      for (const x of [-0.34, 0.34])
        box(g, palette.beam, x, 0.46, 1.27, 0.055, 0.065, 1.3);
      const horse = animal({ ...e, kind: "horse", type: "horse", draft: true });
      horse.scale.setScalar(0.78);
      horse.position.set(0, 0, 1.65);
      g.add(horse);
      g.userData.draftHorse = horse;
      // Both reins run from the driver's hands to the bridle, above the shafts.
      for (const side of [-1, 1]) {
        const rein = new T.CatmullRomCurve3([
          new T.Vector3(side * 0.18, 0.848, 0.781),
          new T.Vector3(side * 0.22, 0.79, 1.32),
          new T.Vector3(side * 0.19, 0.94, 2.28),
        ]);
        mesh(new T.TubeGeometry(rein, 12, 0.014, 4, false), "#423527", g);
      }
      const bridle = mesh(
        new T.TorusGeometry(0.15, 0.018, 4, 8),
        "#423527",
        horse,
        0,
        1.22,
        0.82,
      );
      bridle.rotation.x = Math.PI / 2;
      for (const x of [-0.27, 0.27])
        box(g, iron, x, 0.7, 1.58, 0.025, 0.035, 0.5);
      return g;
    }
    const g = new T.Group();
    if (e.kind === "rock") {
      for (let i = 0; i < 3; i++)
        sphere(
          g,
          i % 2 ? "#b0b3a1" : "#8b9687",
          Math.sin(i) * 0.28,
          0.17 + i * 0.1,
          Math.cos(i) * 0.25,
          0.35,
          1,
          0.8,
          1,
        );
      return g;
    }
    if (e.kind === "ruin") {
      if (
        ["wall", "gate"].includes(
          buildingDefs[String(e.originalType)]?.behavior ||
            String(e.originalType),
        )
      )
        return fortificationRubble(e);
      for (const x of [-0.8, 0.8]) {
        box(g, palette.stone, x, 0.7, 0, 0.5, 1.4, 0.5);
        box(g, "#b4b4a0", x, 1.5, 0, 0.7, 0.18, 0.65);
      }
      box(g, palette.stone, 0, 1.8, 0, 2.3, 0.45, 0.7);
      box(g, "#73664a", 0, 0.15, 0, 1, 0.3, 0.7);
      box(g, "#d8b56b", 0, 0.35, 0, 0.8, 0.1, 0.5);
      for (let i = 0; i < 4; i++)
        sphere(g, "#617c4e", -0.8 + i * 0.5, 0.15, -0.5, 0.3);
      return g;
    }
    if (e.kind === "town") {
      const town = building({
        ...e,
        kind: "building",
        type: e.faction === "enemy" ? "barracks" : "hall",
      });
      g.add(town);
      if (e.faction === "enemy") {
        for (let i = 0; i < 4; i++)
          roofAt(
            g,
            1.4,
            1.4,
            0.75,
            Math.sin(i * 2) * 2,
            Math.cos(i * 2) * 2,
            "#855341",
          );
        flag(g, 0, 3.3, 0, "#a44f3d");
      }
      return g;
    }
    return g;
  }
}
