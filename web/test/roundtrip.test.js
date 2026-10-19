import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { cp, mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../lib/config.js";
import { getHabitData } from "../lib/habits-data.js";
import { logHabitInDailyNote, membersForHabit } from "../lib/daily-note.js";
import { loadCheckInHabits } from "../lib/habits-md.js";
import { listMarkdownNotes } from "../lib/vault-index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtures = join(__dirname, "fixtures");

describe("vault round-trip (fixture copy)", () => {
  let tempDir;
  let config;
  before(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "habits-web-"));
    await cp(fixtures, tempDir, { recursive: true });
    config = loadConfig({
      VAULT_DIR: tempDir,
      DAILY_NOTES_FOLDER: "DIARY/",
      HABITS_MD_PATH: "DATABASES/LIFE/Habits.md",
      GOALS_BASE_PATH: "Goals.base",
      DAY_RANGE: "14",
    });
  });

  after(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("reads Gym as todo on 2025-06-12", async () => {
    const notes = await listMarkdownNotes(tempDir);
    const { mergedBlock } = await loadCheckInHabits(
      tempDir,
      config.habitsMdPath,
      notes
    );
    const data = await getHabitData(
      tempDir,
      config,
      mergedBlock,
      14,
      "2025-06-12"
    );
    const row = data.data.find((r) => r[0] === "2025-06-12");
    assert.ok(row);
    const gym = row.find((c) => c && c.habit === "Gym");
    assert.ok(gym, "Gym should be listed from Habits.md / fixture goals");
    assert.equal(gym.status, "todo");
  });

  it("toggle writes daily note and re-reads success", async () => {
    const notes = await listMarkdownNotes(tempDir);
    const { habits, mergedBlock } = await loadCheckInHabits(
      tempDir,
      config.habitsMdPath,
      notes
    );
    const target = habits.includes("Gym") ? "Gym" : habits[0];
    assert.ok(target, "need at least one habit from Habits.md");

    const date = "2025-06-12";
    const members = membersForHabit(mergedBlock, target);
    await logHabitInDailyNote(
      tempDir,
      config.dailyNotesFolder,
      date,
      target,
      members,
      "success"
    );
    const after = await getHabitData(tempDir, config, mergedBlock, 1, date);
    const cell = after.data[0]?.find((c) => c.habit === target);
    assert.equal(cell?.status, "success");

    const diaryPath = join(tempDir, "DIARY", "2025-06-12.md");
    const raw = await readFile(diaryPath, "utf8");
    assert.match(raw, new RegExp(`\\[\\[${target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i"));

    await logHabitInDailyNote(
      tempDir,
      config.dailyNotesFolder,
      date,
      target,
      members,
      "neutral"
    );
    const cleared = await getHabitData(tempDir, config, mergedBlock, 1, date);
    const cell2 = cleared.data[0]?.find((c) => c.habit === target);
    assert.equal(cell2?.status, "neutral");
  });
});
