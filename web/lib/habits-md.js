import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  flattenHabitNames,
  parseHabitsBlock,
} from "./habits-block.js";

const HABITS_FENCE = /^```habits\s*$/i;
const FENCE_END = /^```\s*$/;

/**
 * Extract all ```habits blocks from Habits.md and merge unique habit rows.
 */
export async function loadCheckInHabits(vaultDir, habitsRelPath, notes) {
  const raw = await readFile(join(vaultDir, habitsRelPath), "utf8");
  const blocks = extractCodeBlocks(raw, "habits");
  const allNames = [];
  const seen = new Set();
  const blockDataList = [];

  for (const source of blocks) {
    const blockData = parseHabitsBlock(source, {
      notes,
      sourcePath: habitsRelPath,
    });
    blockDataList.push(blockData);
    for (const name of flattenHabitNames(blockData)) {
      if (!seen.has(name)) {
        seen.add(name);
        allNames.push(name);
      }
    }
  }

  return { habits: allNames, blockDataList, mergedBlock: mergeBlocks(blockDataList) };
}

function mergeBlocks(blockDataList) {
  const merged = { habits: [], habitGroups: [] };
  const habitSet = new Set();
  const groupNames = new Set();

  for (const b of blockDataList) {
    for (const g of b.habitGroups || []) {
      if (!groupNames.has(g.name)) {
        groupNames.add(g.name);
        merged.habitGroups.push(g);
      }
    }
    for (const h of b.habits || []) {
      if (!habitSet.has(h)) {
        habitSet.add(h);
        merged.habits.push(h);
      }
    }
  }
  return merged;
}

export function extractCodeBlocks(markdown, lang) {
  const lines = markdown.split("\n");
  const blocks = [];
  let inBlock = false;
  let current = [];
  const openRe = new RegExp(`^\\\`\\\`\\\`${lang}\\s*$`, "i");

  for (const line of lines) {
    if (!inBlock && openRe.test(line)) {
      inBlock = true;
      current = [];
      continue;
    }
    if (inBlock && FENCE_END.test(line)) {
      blocks.push(current.join("\n"));
      inBlock = false;
      current = [];
      continue;
    }
    if (inBlock) current.push(line);
  }
  return blocks;
}
