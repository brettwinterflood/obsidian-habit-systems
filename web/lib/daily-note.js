import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { atomicWrite } from "./atomic-write.js";
import { wikiLinkPattern } from "./wiki.js";

const TODO_MARKER = "\u{1F51C}"; // 🔜
const SKIP_MARKER = "\u{1F4DD}"; // 📝

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

/**
 * Update or append a habit marker in a daily note.
 * Uses the same markers the plugin reads: [[habit]] links, 🔜 todo, ❌/fail fail.
 *
 * @param {string} content
 * @param {string} habitName - row habit (group name or individual)
 * @param {string[]} memberNames - wiki link targets to match
 * @param {'success'|'neutral'|'fail'|'todo'} targetStatus
 */
export function applyHabitLogToContent(content, habitName, memberNames, targetStatus) {
  const lines = content === null ? [] : content.split("\n");
  let matchIndex = -1;
  let currentStatus = "neutral";

  for (let i = 0; i < lines.length; i++) {
    const st = lineHabitStatus(lines[i], memberNames);
    if (st) {
      matchIndex = i;
      currentStatus = st;
      break;
    }
  }

  if (targetStatus === "neutral") {
    if (matchIndex >= 0) {
      lines.splice(matchIndex, 1);
      return joinLines(lines);
    }
    return content ?? "";
  }

  const link = `[[${habitName}]]`;

  if (matchIndex >= 0) {
    let line = lines[matchIndex];
    if (targetStatus === "success") {
      line = line.replaceAll(TODO_MARKER, "").replace(/\s+/g, " ").trimEnd();
      if (!wikiLinkPattern(habitName).test(line) && memberNames.length === 1) {
        /* keep line if it matched via alias member */
      }
    } else if (targetStatus === "todo") {
      if (!line.includes(TODO_MARKER)) line = `${line} ${TODO_MARKER}`.trim();
    } else if (targetStatus === "fail") {
      line = line.replaceAll(TODO_MARKER, "").trimEnd();
      if (!line.toLowerCase().includes("fail") && !line.includes("\u274c")) {
        line = `${line} fail`;
      }
    }
    lines[matchIndex] = line;
    return joinLines(lines);
  }

  let newLine;
  if (targetStatus === "success") newLine = `- ${link}`;
  else if (targetStatus === "todo") newLine = `- ${TODO_MARKER} ${link}`;
  else if (targetStatus === "fail") newLine = `- failed ${link}`;
  else newLine = `- ${link}`;

  if (lines.length === 0) return newLine;
  const trimmed = lines[lines.length - 1];
  if (trimmed === "") return [...lines, newLine].join("\n");
  return [...lines, "", newLine].join("\n");
}

function joinLines(lines) {
  if (lines.length === 0) return "";
  return lines.join("\n");
}

/**
 * @param {string} vaultDir
 * @param {string} dailyNotesFolder
 * @param {string} date YYYY-MM-DD
 * @param {string} habitName
 * @param {string[]} memberNames
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
  const next = applyHabitLogToContent(
    content,
    habitName,
    memberNames,
    targetStatus
  );
  await atomicWrite(path, next.endsWith("\n") || next === "" ? next : `${next}\n`);
  return { path, content: next };
}

export function membersForHabit(blockData, habitName) {
  const group = blockData.habitGroups?.find((g) => g.name === habitName);
  return group ? group.members : [habitName];
}
