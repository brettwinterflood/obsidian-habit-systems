import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyHabitLogToContent,
  lineHabitStatus,
} from "../lib/daily-note.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtureDiary = join(__dirname, "fixtures/DIARY/2025-06-12.md");

describe("daily note habit markers", () => {
  it("reads Gym todo from fixture (plugin read rules)", async () => {
    const content = await readFile(fixtureDiary, "utf8");
    const lines = content.split("\n");
    const gymLine = lines.find((l) => l.includes("[[Gym]]"));
    assert.ok(gymLine);
    assert.equal(lineHabitStatus(gymLine, ["Gym"]), "todo");
  });

  it("round-trips success log without losing surrounding lines", async () => {
    const content = await readFile(fixtureDiary, "utf8");
    const next = applyHabitLogToContent(
      content,
      "Cold approach",
      ["Cold approach"],
      "success"
    );
    assert.match(next, /\[\[Cold approach\]\]/);
    assert.ok(next.includes("failed [[🥦 Eat clean]]"));
    const back = applyHabitLogToContent(
      next,
      "Cold approach",
      ["Cold approach"],
      "neutral"
    );
    assert.ok(!back.includes("[[Cold approach]]"));
  });

  it("clears todo marker when marking success", () => {
    const line = "- [x] 🔜 need to go to [[Gym]] today ✅ 2025-06-13";
    const next = applyHabitLogToContent(line, "Gym", ["Gym"], "success");
    assert.ok(!next.includes("🔜"));
    assert.match(next, /\[\[Gym\]\]/);
  });
});
