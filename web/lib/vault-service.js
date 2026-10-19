import { loadCheckInHabits } from "./habits-md.js";
import { getHabitData, computeStreaks } from "./habits-data.js";
import { loadGoalsFromBase } from "./goals-base.js";
import { listMarkdownNotes } from "./vault-index.js";
import { logHabitInDailyNote, membersForHabit } from "./daily-note.js";
import dayjs from "dayjs";

export class VaultService {
  /** @param {ReturnType<import('./config.js').loadConfig>} config */
  constructor(config) {
    this.config = config;
    this._notes = null;
    this._notesLoadedAt = 0;
    this._cacheMs = 60_000;
  }

  async notes(force = false) {
    const now = Date.now();
    if (!force && this._notes && now - this._notesLoadedAt < this._cacheMs) {
      return this._notes;
    }
    this._notes = await listMarkdownNotes(this.config.vaultDir);
    this._notesLoadedAt = now;
    return this._notes;
  }

  async habitsContext() {
    const notes = await this.notes();
    const { habits, mergedBlock } = await loadCheckInHabits(
      this.config.vaultDir,
      this.config.habitsMdPath,
      notes
    );
    return { habits, blockData: mergedBlock, notes };
  }

  async todayCheckIn() {
    const { blockData } = await this.habitsContext();
    const habitData = await getHabitData(
      this.config.vaultDir,
      this.config,
      blockData,
      1
    );
    const today = dayjs().format("YYYY-MM-DD");
    const row = habitData.data[0] || [];
    const items = row.slice(1).map((cell) => ({
      habit: cell.habit,
      status: cell.status,
      contexts: cell.contexts,
    }));
    const streaks = computeStreaks(
      await getHabitData(this.config.vaultDir, this.config, blockData)
    );
    return { date: today, items, streaks };
  }

  async history(days) {
    const { blockData } = await this.habitsContext();
    const habitData = await getHabitData(
      this.config.vaultDir,
      this.config,
      blockData,
      days || this.config.dayRange
    );
    const streaks = computeStreaks(habitData);
    return { ...habitData, streaks };
  }

  async goals() {
    const notes = await this.notes();
    return loadGoalsFromBase(
      this.config.vaultDir,
      this.config.goalsBasePath,
      notes
    );
  }

  async toggleHabitToday(habitName) {
    const { blockData } = await this.habitsContext();
    const members = membersForHabit(blockData, habitName);
    const date = dayjs().format("YYYY-MM-DD");
    const habitData = await getHabitData(
      this.config.vaultDir,
      this.config,
      blockData,
      1
    );
    const row = habitData.data[0] || [];
    const cell = row.find((c) => c && c.habit === habitName);
    const current = cell?.status || "neutral";
    const target = current === "success" ? "neutral" : "success";
    await logHabitInDailyNote(
      this.config.vaultDir,
      this.config.dailyNotesFolder,
      date,
      habitName,
      members,
      target
    );
    return { habit: habitName, date, status: target };
  }
}
