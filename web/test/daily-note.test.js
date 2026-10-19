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

  it("round-trips app-written success without losing surrounding lines", async () => {
    const content = await readFile(fixtureDiary, "utf8");
    const added = applyHabitLogToContent(
      content,
      "Cold approach",
      ["Cold approach"],
      "success"
    ).content;
    assert.match(added, /^- \[\[Cold approach\]\]$/m);
    assert.ok(added.includes("failed [[🥦 Eat clean]]"));
    const back = applyHabitLogToContent(
      added,
      "Cold approach",
      ["Cold approach"],
      "neutral"
    ).content;
    assert.ok(!back.match(/^- \[\[Cold approach\]\]$/m));
    assert.ok(back.includes("failed [[🥦 Eat clean]]"));
  });

  it("does not modify user lines when marking success", () => {
    const line = "- [x] 🔜 need to go to [[Gym]] today ✅ 2025-06-13";
    const { content } = applyHabitLogToContent(line, "Gym", ["Gym"], "success");
    assert.ok(content.includes("🔜 need to go to"));
    assert.match(content, /^- \[\[Gym\]\]$/m);
  });

  it("user-authored line survives un-toggle (409, content unchanged)", () => {
    const content = "- [x] 🔜 need to go to [[Gym]] today";
    const result = applyHabitLogToContent(content, "Gym", ["Gym"], "neutral");
    assert.ok(result.conflict);
    assert.equal(result.content, content);
  });

  it("un-toggle removes only the app-written duplicate line", () => {
    const user = "- [x] 🔜 need to go to [[Gym]] today";
    const content = `${user}\n- [[Gym]]`;
    const { content: next, conflict } = applyHabitLogToContent(
      content,
      "Gym",
      ["Gym"],
      "neutral"
    );
    assert.equal(conflict, undefined);
    assert.equal(next, user);
  });
});
