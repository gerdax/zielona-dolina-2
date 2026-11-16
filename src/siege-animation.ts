const smooth = (x: number) => {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
};
/** One combat interval: draw back, strike/release, recover and reload. */
export function siegePose(age: number) {
  if (age < 0 || age >= 1) return { arm: 0, ram: 0, loaded: true };
  const arm =
    age < 0.18
      ? -0.15 * smooth(age / 0.18)
      : age < 0.38
        ? -0.15 + 1.85 * smooth((age - 0.18) / 0.2)
        : 1.7 * (1 - smooth((age - 0.38) / 0.57));
  const ram =
    age < 0.18
      ? -0.22 * smooth(age / 0.18)
      : age < 0.3
        ? -0.22 + 0.64 * smooth((age - 0.18) / 0.12)
        : 0.42 * (1 - smooth((age - 0.3) / 0.55));
  return { arm, ram, loaded: age < 0.18 || age > 0.88 };
}
