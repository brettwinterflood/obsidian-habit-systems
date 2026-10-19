import { extractHabitDataFromTaggedNotes } from "./habits-data.js";
import { findNoteByBasename } from "./vault-index.js";
import { wikiLinkTarget } from "./wiki.js";

/**
 * Parse a ```habits code block body (mirrors src/main.ts renderHabitTracker).
 * @param {string} source
 * @param {object} ctx
 * @param {import('./vault-index.js').VaultNote[]} ctx.notes
 * @param {string} [ctx.sourcePath]
 */
export function parseHabitsBlock(source, ctx) {
  const blockData = {
    habits: [],
    habitGroups: [],
    groupSources: [],
    expandedGroupSources: [],
    tag: "habit",
  };

  const lines = source
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);

  let sourceType;
  let frontmatterField = "habits";
  let rankMin;
  let rankMax;
  let tag = "habit";
  const groupLines = [];
  const habitLines = [];
  const groupSources = [];
  const expandedGroupSources = [];

  for (const line of lines) {
    if (line.match(/^source\s*:/i)) {
      sourceType = line.split(":")[1].trim().toLowerCase();
      continue;
    }
    if (line.match(/^field\s*:/i)) {
      frontmatterField = line.split(":")[1].trim();
      continue;
    }
    if (line.match(/^groups\s*:/i)) {
      const groupsStr = line.split(":")[1].trim();
      if (groupsStr) {
        groupSources.push(
          ...groupsStr.split(",").map((g) => g.trim()).filter(Boolean)
        );
      }
      continue;
    }
    if (line.match(/^groups_expanded\s*:/i)) {
      const expandedStr = line.split(":")[1].trim();
      if (expandedStr) {
        expandedGroupSources.push(
          ...expandedStr.split(",").map((g) => g.trim()).filter(Boolean)
        );
      }
      continue;
    }
    if (line.match(/^rank_min\s*:/i)) {
      const val = parseInt(line.split(":")[1].trim(), 10);
      if (!isNaN(val) && val >= 0) rankMin = val;
      continue;
    }
    if (line.match(/^rank_max\s*:/i)) {
      const val = parseInt(line.split(":")[1].trim(), 10);
      if (!isNaN(val) && val >= 0) rankMax = val;
      continue;
    }
    if (line.match(/^tag\s*:/i)) {
      tag = line.split(":")[1].trim();
      continue;
    }
    if (sourceType !== "groups_tag") {
      if (line.includes(":")) groupLines.push(line);
      else habitLines.push(line);
    }
  }

  blockData.groupSources = groupSources;
  blockData.expandedGroupSources = expandedGroupSources;
  blockData.tag = tag;

  if (groupSources.length > 0 || expandedGroupSources.length > 0) {
    for (const groupName of groupSources) {
      const groupFile = findNoteByBasename(ctx.notes, groupName);
      if (groupFile) {
        const members = getHabitsFromProps(groupFile.frontmatter, frontmatterField);
        if (members.length > 0) {
          blockData.habitGroups.push({ name: groupName, members });
        }
      }
    }
    for (const groupName of expandedGroupSources) {
      const groupFile = findNoteByBasename(ctx.notes, groupName);
      if (groupFile) {
        const members = getHabitsFromProps(groupFile.frontmatter, frontmatterField);
        if (members.length > 0) {
          blockData.habits.push(...members);
        }
      }
    }
  }

  if (sourceType === "note") {
    const filePath = ctx.sourcePath || "";
    const fileName = (filePath.split("/").pop() || filePath).replace(/\.md$/, "");
    blockData.habits = [fileName];
  } else if (sourceType === "props") {
    const note = ctx.sourcePath
      ? ctx.notes.find((n) => n.path === ctx.sourcePath)
      : null;
    const habits = note
      ? getHabitsFromProps(note.frontmatter, frontmatterField)
      : [];
    blockData.habits = habits;
  } else if (sourceType === "groups_tag") {
    const taggedData = extractHabitDataFromTaggedNotes(
      ctx.notes,
      tag,
      rankMin,
      rankMax
    );
    blockData.habits = taggedData.habits;
    blockData.habitGroups = taggedData.habitGroups;
  } else {
    for (const line of groupLines) {
      const [groupName, membersStr] = line.split(":").map((s) => s.trim());
      if (groupName && membersStr) {
        const members = membersStr
          .split(",")
          .map((m) => m.trim())
          .filter(Boolean);
        if (members.length > 0) {
          blockData.habitGroups.push({ name: groupName, members });
        }
      }
    }
    for (const line of habitLines) {
      blockData.habits.push(line);
    }
  }

  return blockData;
}

export function getHabitsFromProps(frontmatter, frontmatterField) {
  if (!frontmatter || !frontmatter[frontmatterField]) return [];
  const fieldVal = frontmatter[frontmatterField];
  let wikiLinks = [];
  if (Array.isArray(fieldVal)) wikiLinks = fieldVal;
  else if (typeof fieldVal === "string") {
    wikiLinks = fieldVal.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return wikiLinks.map((entry) => wikiLinkTarget(entry));
}

/**
 * Flatten block into display habits (groups as single rows), matching getHabitData.
 */
export function flattenHabitNames(blockData) {
  const habits = [];
  const processed = new Set();
  for (const group of blockData.habitGroups || []) {
    if (group.members?.length > 0) {
      habits.push(group.name);
      for (const m of group.members) processed.add(m);
    }
  }
  for (const habit of blockData.habits || []) {
    if (!processed.has(habit)) habits.push(habit);
  }
  return habits;
}
