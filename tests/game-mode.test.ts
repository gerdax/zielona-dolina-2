import { it, expect } from "vitest";
import { gameMode, saveSlot } from "../src/game-mode";
it("enables the public test village with a separate save database", () => {
  expect(gameMode("?qa=village", false)).toBe("village");
  expect(saveSlot("?qa=village")).not.toBe(saveSlot(""));
  expect(gameMode("?qa=stress", false)).toBeNull();
  expect(gameMode("?qa=stress", true)).toBe("stress");
  expect(gameMode("", false)).toBeNull();
});
