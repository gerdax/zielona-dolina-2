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
      const iron = "#4c5953",
        rope = "#d4bc84";
      // Masonry courses, reinforced corners and a visible siege platform.
      for (const y of [0.4, 0.8, 1.2, 1.6])
        for (const side of [-1, 1]) {
          box(g, "#858c7d", side * 0.606, y, 0, 0.012, 0.018, 1.18);
          box(g, "#858c7d", 0, y, side * 0.606, 1.18, 0.018, 0.012);
        }
      for (const x of [-0.52, 0.52])
        for (const z of [-0.52, 0.52])
          box(g, "#bcc0a7", x, 0.93, z, 0.2, 1.86, 0.2);
      box(g, "#b9bba3", 0, 0.09, 0, 1.36, 0.18, 1.36);
      box(g, "#3e6868", 0.37, 1.05, 0.62, 0.28, 0.68, 0.025);
      box(g, "#d3b773", 0.37, 0.73, 0.64, 0.3, 0.05, 0.025);
      box(g, wood, 0, height + 0.01, 0, 1.25, 0.07, 1.25);
      const turret = new T.Group();
      turret.position.y = height + 0.18;
      g.add(turret);
      g.userData.ballista = turret;
      const cylinder = (
        parent: T.Object3D,
        c: string,
        x: number,
        y: number,
        z: number,
        r: number,
        h: number,
      ) => {
        const m = new T.Mesh(
          new T.CylinderGeometry(r, r, h, 12),
          new T.MeshStandardMaterial({ color: c, roughness: 0.9 }),
        );
        m.position.set(x, y, z);
        m.castShadow = m.receiveShadow = true;
        parent.add(m);
        return m;
      };
      cylinder(turret, iron, 0, 0.025, 0, 0.32, 0.12);
      cylinder(turret, wood, 0, 0.14, 0, 0.19, 0.24);
      const weapon = new T.Group();
      turret.add(weapon);
      g.userData.ballistaWeapon = weapon;
      const strings: T.Mesh[] = [];
      g.userData.ballistaStrings = strings;
      box(weapon, dark, 0, 0.29, -0.08, 0.32, 0.16, 1.38);
      for (const x of [-0.13, 0.13])
        box(weapon, wood, x, 0.37, -0.06, 0.065, 0.08, 1.43);
      box(weapon, iron, 0, 0.4, 0.51, 0.35, 0.04, 0.18);
      // Curved arms, iron tips and a taut V-shaped string read as a giant crossbow.
      for (const side of [-1, 1]) {
        const points = [
          new T.Vector3(0, 0.35, 0.38),
          new T.Vector3(side * 0.35, 0.35, 0.43),
          new T.Vector3(side * 0.66, 0.35, 0.32),
          new T.Vector3(side * 0.85, 0.35, 0.14),
        ];
        const limb = new T.Mesh(
          new T.TubeGeometry(
            new T.CatmullRomCurve3(points),
            10,
            0.065,
            5,
            false,
          ),
          new T.MeshStandardMaterial({ color: wood, roughness: 0.9 }),
        );
        limb.castShadow = true;
        weapon.add(limb);
        box(weapon, iron, side * 0.82, 0.35, 0.16, 0.12, 0.14, 0.16);
        const string = new T.Mesh(
          new T.CylinderGeometry(0.014, 0.014, 1, 5),
          new T.MeshStandardMaterial({ color: rope }),
        );
        string.userData.side = side;
        weapon.add(string);
        strings.push(string);
        const skein = cylinder(
          weapon,
          rope,
          side * 0.2,
          0.35,
          0.38,
          0.095,
          0.3,
        );
        cylinder(weapon, iron, side * 0.2, 0.51, 0.38, 0.12, 0.045);
        box(weapon, iron, side * 0.2, 0.17, 0.38, 0.24, 0.05, 0.22);
      }
      const winchAssembly = new T.Group();
      winchAssembly.position.set(0, 0.35, -0.62);
      weapon.add(winchAssembly);
      g.userData.ballistaWinch = winchAssembly;
      const winch = cylinder(winchAssembly, wood, 0, 0, 0, 0.1, 0.53);
      winch.rotation.z = Math.PI / 2;
      for (const x of [-0.25, 0.25])
        box(weapon, iron, x, 0.32, -0.62, 0.065, 0.3, 0.2);
      box(winchAssembly, iron, 0.33, 0.01, 0, 0.17, 0.045, 0.045);
      box(winchAssembly, wood, 0.41, 0.08, 0, 0.045, 0.18, 0.045);
      const bolt = box(weapon, "#c5ab78", 0, 0.38, 0.35, 0.035, 0.035, 0.85);
      const head = new T.Mesh(
        new T.ConeGeometry(0.065, 0.2, 4),
        new T.MeshStandardMaterial({
          color: "#bac4bd",
          metalness: 0.35,
          roughness: 0.55,
        }),
      );
      head.rotation.x = Math.PI / 2;
      head.position.z = 0.49;
      bolt.add(head);
      for (const side of [-1, 1]) {
        const feather = box(
          bolt,
          "#e2d6b3",
          0,
          side * 0.045,
          -0.32,
          0.025,
          0.09,
          0.16,
        );
        feather.rotation.z = side * 0.3;
      }
      g.userData.bolt = bolt;
      const loaded = bolt.clone(true);
      weapon.add(loaded);
      g.userData.ballistaLoaded = loaded;
      // Spare bolts sit against the tower, outside the rotating assembly.
      for (let i = 0; i < 3; i++) {
        box(g, wood, 0.67, 0.75, -0.3 + i * 0.17, 0.035, 1, 0.035);
        const tip = box(
          g,
          iron,
          0.67,
          1.29,
          -0.3 + i * 0.17,
          0.075,
          0.14,
          0.06,
        );
        tip.rotation.z = 0.2;
      }
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
