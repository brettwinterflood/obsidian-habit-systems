import dayjs from "dayjs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { wikiLinkPattern } from "./wiki.js";
import { noteHasTag } from "./vault-index.js";
export function filterByRank(items, rankMin, rankMax) {
  return items.filter((item) => {
    const rank = item.rank || 0;
    if (rankMin !== undefined && rank < rankMin) return false;
    if (rankMax !== undefined && rank > rankMax) return false;
    return true;
  });
}

const TODO_MARKER = "\u{1F51C}"; // 🔜
const SKIP_MARKER = "\u{1F4DD}"; // 📝

/**
 * @param {import('./vault-index.js').VaultNote[]} notes
 */
export function extractHabitDataFromTaggedNotes(notes, tag, rankMin, rankMax) {
  const taggedItems = [];

  for (const note of notes) {
    try {
      if (!noteHasTag(note, tag)) continue;
      const fm = note.frontmatter;
      const itemName = fm.name || fm.habit || fm.goal || note.basename;
      const rank = fm.rank || 0;
      const habits = fm.habits || [];
      if (!habits.length) continue;

      const habitNames = habits.map((entry) => {
        const match = String(entry).match(/\[\[(.*?)\]\]/);
        return match ? match[1] : String(entry);
      });
      taggedItems.push({ name: itemName, rank, habits: habitNames });
    } catch {
      /* skip */
    }
  }

  const filteredItems = filterByRank(taggedItems, rankMin, rankMax);
  filteredItems.sort((a, b) => a.rank - b.rank);

  const individualHabits = [];
  const habitGroups = [];

  for (const taggedItem of filteredItems) {
    if (taggedItem.habits.length === 1) {
      individualHabits.push(taggedItem.habits[0]);
    } else if (taggedItem.habits.length > 1) {
      habitGroups.push({
        name: taggedItem.name,
        members: taggedItem.habits,
      });
    }
  }

  return { habits: individualHabits, habitGroups };
}

/**
 * Read habit statuses from daily notes (mirrors src/data.ts getHabitData).
 */
export async function getHabitData(
  vaultDir,
  settings,
  blockData,
  customDayRange,
  referenceDate
) {
  const effectiveDayRange = customDayRange || settings.dayRange;
  const today = referenceDate ? dayjs(referenceDate) : dayjs();
  const startDate = today.subtract(effectiveDayRange - 1, "day");

  const habits = [];
  const processedHabits = new Set();

  for (const group of blockData.habitGroups || []) {
    if (group.members?.length > 0) {
      habits.push(group.name);
      for (const member of group.members) processedHabits.add(member);
    }
  }
  for (const habit of blockData.habits || []) {
    if (!processedHabits.has(habit)) habits.push(habit);
  }

  const dates = [];
  for (let i = effectiveDayRange - 1; i >= 0; i--) {
    const date = today.subtract(i, "day");
    const dow = date.day();
    if (settings.showWeekends || (dow !== 0 && dow !== 6)) {
      dates.push(date.format("YYYY-MM-DD"));
    }
  }

  const habitData = [];

  for (const date of dates) {
    const content = await readDailyNote(vaultDir, settings.dailyNotesFolder, date);
    const row = [date];

    if (content !== null) {
      const lines = content.split("\n");
      for (const habit of habits) {
        const groupMembers =
          blockData.habitGroups?.find((g) => g.name === habit)?.members || [
            habit,
          ];
        let status = "neutral";
        const foundContexts = [];

        for (const line of lines) {
          if (line.includes(SKIP_MARKER)) continue;

          for (const member of groupMembers) {
            const linkPattern = wikiLinkPattern(member);
            if (linkPattern.test(line)) {
              const cleanLine = line.replace(/^[\s\-\*]+/, "").trim();
              foundContexts.push(cleanLine);
              if (line.includes(TODO_MARKER)) status = "todo";
              else if (
                line.toLowerCase().includes("\u274c") ||
                line.toLowerCase().includes("fail")
              ) {
                status = "fail";
              } else {
                status = "success";
              }
            }
          }
        }

        row.push({
          status,
          contexts: [...new Set(foundContexts)],
          habit,
        });
      }
    } else {
      for (const habit of habits) {
        row.push({ status: "neutral", contexts: [], habit });
      }
    }

    habitData.push(row);
  }

  return { habits, dates, data: habitData };
}

async function readDailyNote(vaultDir, dailyNotesFolder, date) {
  const possiblePaths = [
    join(vaultDir, dailyNotesFolder, `${date}.md`),
    join(vaultDir, dailyNotesFolder, date),
  ];
  for (const path of possiblePaths) {
    try {
      return await readFile(path, "utf8");
    } catch {
      /* try next */
    }
  }
  return null;
}

export function computeStreaks(habitData) {
  const streaks = {};
  for (const habit of habitData.habits) {
    let streak = 0;
    for (let i = habitData.data.length - 1; i >= 0; i--) {
      const row = habitData.data[i];
      const cell = row.find((c) => c && c.habit === habit);
      if (cell?.status === "success") streak++;
      else if (cell?.status !== "neutral") break;
      else break;
    }
    streaks[habit] = streak;
  }
  return streaks;
}
