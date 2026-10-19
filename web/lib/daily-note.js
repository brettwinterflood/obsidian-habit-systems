import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { atomicWrite } from "./atomic-write.js";
import { wikiLinkPattern } from "./wiki.js";

const TODO_MARKER = "\u{1F51C}"; // 🔜
const SKIP_MARKER = "\u{1F4DD}"; // 📝

export class HabitLogConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = "HabitLogConflictError";
    this.statusCode = 409;
  }
}

export function appWrittenSuccessLine(habitName) {
  return `- [[${habitName}]]`;
}

export function appWrittenTodoLine(habitName) {
  return `- ${TODO_MARKER} [[${habitName}]]`;
}

export function appWrittenFailLine(habitName) {
  return `- failed [[${habitName}]]`;
}

/** Whole-line match for lines this app may append (not user prose). */
export function isAppWrittenLine(line, habitName) {
  const trimmed = line.trimEnd();
  return (
    trimmed === appWrittenSuccessLine(habitName) ||
    trimmed === appWrittenTodoLine(habitName) ||
    trimmed === appWrittenFailLine(habitName)
  );
}

export function findAppWrittenLineIndex(lines, habitName) {
  for (let i = 0; i < lines.length; i++) {
    if (isAppWrittenLine(lines[i], habitName)) return i;
  }
  return -1;
}

export function dailyNotePaths(vaultDir, dailyNotesFolder, date) {
  return [
    join(vaultDir, dailyNotesFolder, `${date}.md`),
    join(vaultDir, dailyNotesFolder, date),
  ];
}

export async function readDailyNoteContent(vaultDir, dailyNotesFolder, date) {
  for (const path of dailyNotePaths(vaultDir, dailyNotesFolder, date)) {
    try {
      const content = await readFile(path, "utf8");
      return { path, content };
    } catch {
      /* next */
    }
  }
  const path = join(vaultDir, dailyNotesFolder, `${date}.md`);
  return { path, content: null };
}

/**
 * Parse line status for a habit member (inverse of src/data.ts).
 * @returns {'neutral'|'todo'|'fail'|'success'}
 */
export function lineHabitStatus(line, memberNames) {
  if (line.includes(SKIP_MARKER)) return null;
  for (const member of memberNames) {
    if (!wikiLinkPattern(member).test(line)) continue;
    if (line.includes(TODO_MARKER)) return "todo";
    if (line.toLowerCase().includes("\u274c") || line.toLowerCase().includes("fail")) {
      return "fail";
    }
    return "success";
  }
  return null;
}

function hasUserHabitLine(lines, memberNames, habitName) {
  for (const line of lines) {
    if (isAppWrittenLine(line, habitName)) continue;
    if (lineHabitStatus(line, memberNames)) return true;
  }
  return false;
}

const CONFLICT_MSG =
  "This habit is already recorded in your daily note text. Edit that line in Obsidian, or remove it there before un-logging here.";

/**
 * @returns {{ content: string, conflict?: { code: string, message: string } }}
 */
export function applyHabitLogToContent(content, habitName, memberNames, targetStatus) {
  const lines = content === null ? [] : content.split("\n");

  if (targetStatus === "neutral") {
    const appIdx = findAppWrittenLineIndex(lines, habitName);
    if (appIdx >= 0) {
      lines.splice(appIdx, 1);
      return { content: joinLines(lines) };
    }
    if (hasUserHabitLine(lines, memberNames, habitName)) {
      return {
        content: content ?? "",
        conflict: { code: "HABIT_USER_LINE", message: CONFLICT_MSG },
      };
    }
    return { content: content ?? "" };
  }

  if (targetStatus === "success") {
    if (findAppWrittenLineIndex(lines, habitName) >= 0) {
      return { content: content ?? "" };
    }
    const newLine = appWrittenSuccessLine(habitName);
    return { content: appendLine(lines, newLine) };
  }

  const appIdx = findAppWrittenLineIndex(lines, habitName);
  if (appIdx >= 0) {
    let line = lines[appIdx];
    if (targetStatus === "todo") {
      lines[appIdx] = appWrittenTodoLine(habitName);
    } else if (targetStatus === "fail") {
      lines[appIdx] = appWrittenFailLine(habitName);
    } else {
      lines[appIdx] = line;
    }
    return { content: joinLines(lines) };
  }

  let newLine;
  if (targetStatus === "todo") newLine = appWrittenTodoLine(habitName);
  else if (targetStatus === "fail") newLine = appWrittenFailLine(habitName);
  else newLine = appWrittenSuccessLine(habitName);

  return { content: appendLine(lines, newLine) };
}

function appendLine(lines, newLine) {
  if (lines.length === 0) return newLine;
  if (lines[lines.length - 1] === "") return [...lines, newLine].join("\n");
  return [...lines, "", newLine].join("\n");
}

function joinLines(lines) {
  if (lines.length === 0) return "";
  return lines.join("\n");
}

/**
 * @param {'success'|'neutral'} targetStatus — check-in toggles success/neutral
 */
export async function logHabitInDailyNote(
  vaultDir,
  dailyNotesFolder,
  date,
  habitName,
  memberNames,
  targetStatus
) {
  const { path, content } = await readDailyNoteContent(
    vaultDir,
    dailyNotesFolder,
    date
  );
  const result = applyHabitLogToContent(
    content,
    habitName,
    memberNames,
    targetStatus
  );
  if (result.conflict) {
    throw new HabitLogConflictError(result.conflict.message);
  }
  const next = result.content;
  await atomicWrite(path, next.endsWith("\n") || next === "" ? next : `${next}\n`);
  return { path, content: next };
}

export function membersForHabit(blockData, habitName) {
  const group = blockData.habitGroups?.find((g) => g.name === habitName);
  return group ? group.members : [habitName];
}
