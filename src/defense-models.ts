import * as T from "three";
const materials = new Map<string, T.MeshStandardMaterial>();
function box(
  g: T.Object3D,
  c: string,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
) {
  if (!materials.has(c))
    materials.set(c, new T.MeshStandardMaterial({ color: c, roughness: 0.95 }));
  const m = new T.Mesh(new T.BoxGeometry(w, h, d), materials.get(c));
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  return m;
}
export function defenseModel(type: string) {
  if (
    ![
      "bastion",
      "ballistaTower",
      "spikePit",
      "chevaux",
      "fortifiedGate",
      "rallyPoint",
      "fortressArmory",
    ].includes(type)
  )
    return;
  const g = new T.Group(),
    stone = "#a5ab96",
    dark = "#4e412f",
    wood = "#9d7548";
  if (type === "bastion" || type === "ballistaTower") {
    const height = type === "bastion" ? 1.3 : 2;
    box(
      g,
      stone,
      0,
      height / 2,
      0,
      type === "bastion" ? 1.7 : 1.2,
      height,
      type === "bastion" ? 1.7 : 1.2,
    );
    box(
      g,
      "#bfc1a6",
      0,
      height - 0.06,
      0,
      type === "bastion" ? 1.9 : 1.5,
      0.12,
      type === "bastion" ? 1.9 : 1.5,
    );
    const size = type === "bastion" ? 0.85 : 0.65;
    for (const sign of [-1, 1])
      for (let i = 0; i < 4; i++) {
        box(
          g,
          stone,
          sign * size,
          height + 0.15,
          -size + (i * size * 2) / 3,
          0.18,
          0.3,
          0.22,
        );
        box(
          g,
          stone,
          -size + (i * size * 2) / 3,
          height + 0.15,
          sign * size,
          0.22,
          0.3,
          0.18,
        );
      }
    box(g, dark, 0, 0.55, size + 0.02, 0.3, 0.7, 0.03);
    if (type === "ballistaTower") {
      const turret = new T.Group();
      turret.position.y = height + 0.18;
      g.add(turret);
      g.userData.ballista = turret;
      box(turret, dark, 0, 0.14, 0, 0.18, 0.3, 0.18);
      box(turret, wood, 0, 0.3, 0, 0.16, 0.14, 1.25);
      for (const side of [-1, 1]) {
        const bow = box(turret, wood, side * 0.35, 0.31, 0.3, 0.8, 0.1, 0.09);
        bow.rotation.y = side * 0.3;
      }
      box(turret, "#c9bb88", 0, 0.33, 0.06, 1.25, 0.025, 0.025);
      box(turret, "#abb2a4", 0, 0.38, 0.45, 0.035, 0.035, 0.8);
      const bolt = box(turret, "#ddd4ad", 0, 0.38, 0.5, 0.04, 0.04, 0.7);
      g.userData.bolt = bolt;
    }
  } else if (type === "spikePit") {
    box(g, "#493f2d", 0, 0.015, 0, 0.95, 0.035, 0.95);
    for (const x of [-0.35, 0, 0.35])
      for (const z of [-0.35, 0, 0.35]) {
        const stake = box(g, wood, x, 0.13, z, 0.06, 0.3, 0.06);
        stake.rotation.x = 0.25;
      }
    for (const x of [-0.47, 0.47]) box(g, "#92815a", x, 0.04, 0, 0.06, 0.07, 1);
  } else if (type === "chevaux") {
    for (const z of [-0.4, 0, 0.4])
      for (const side of [-1, 1]) {
        const beam = box(g, wood, 0, 0.35, z, 0.08, 0.9, 0.08);
        beam.rotation.z = side * 0.8;
      }
    box(g, dark, 0, 0.38, 0, 0.1, 0.1, 1.1);
  } else if (type === "fortifiedGate") {
    // Same physical orientation and door hook as the existing gates.
    for (const z of [-1.02, 1.02]) {
      box(g, stone, 0, 1.15, z, 0.85, 2.3, 0.65);
      box(g, "#c0c2a9", 0, 2.32, z, 1, 0.12, 0.8);
      for (const x of [-0.35, 0.35]) box(g, stone, x, 2.48, z, 0.25, 0.25, 0.7);
    }
    box(g, stone, 0, 2.03, 0, 0.6, 0.4, 1.6);
    const door = new T.Group();
    g.add(door);
    g.userData.gateDoor = door;
    for (let i = 0; i < 7; i++)
      box(door, "#48534b", 0, 0.85, -0.65 + i * 0.215, 0.09, 1.7, 0.055);
    for (const y of [0.25, 0.8, 1.35])
      box(door, "#616b5d", 0, y, 0, 0.12, 0.06, 1.4);
  } else if (type === "rallyPoint") {
    box(g, stone, 0, 0.04, 0, 0.9, 0.08, 0.9);
    box(g, dark, 0, 0.9, 0, 0.065, 1.8, 0.065);
    box(g, "#b7a25b", 0.3, 1.45, 0, 0.6, 0.42, 0.04);
    box(g, "#416f72", 0.3, 1.45, 0.025, 0.22, 0.28, 0.025);
    for (const x of [-0.4, 0.4]) box(g, wood, x, 0.14, 0, 0.16, 0.28, 0.35);
  } else {
    box(g, stone, 0, 0.8, 0, 1.6, 1.6, 1.4);
    for (const side of [-1, 1]) {
      const roof = box(g, "#496c70", side * 0.45, 1.78, 0, 1.1, 0.08, 1.8);
      roof.rotation.z = -side * 0.5;
    }
    box(g, dark, 0, 0.5, 0.72, 0.4, 1, 0.04);
    for (const x of [-0.55, 0.55]) {
      box(g, dark, x, 0.7, 0.78, 0.06, 1.2, 0.06);
      for (const i of [-1, 0, 1]) {
        box(g, "#b9c1af", x + i * 0.1, 0.85, 0.8, 0.035, 0.7, 0.035);
      }
    }
    box(g, wood, 0.9, 0.4, 0.2, 0.4, 0.8, 0.6);
  }
  return g;
}
