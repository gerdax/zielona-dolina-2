export function gameMode(search: string, development: boolean) {
  const requested = new URLSearchParams(search).get("qa");
  return requested === "village" ? "village" : development ? requested : null;
}
export function saveSlot(search: string) {
  return new URLSearchParams(search).get("qa") === "village"
    ? "zielona-dolina-ii-test-village"
    : "zielona-dolina-ii";
}
