import { noteHasTag } from "./vault-index.js";
import { wikiLinkTarget } from "./wiki.js";

/**
 * @param {import('./vault-index.js').VaultNote[]} notes
 * @param {object} blockData
 */
export function getGoalsData(notes, blockData = {}) {
  const goals = [];

  if (blockData.customGoals?.length) {
    for (const goalName of blockData.customGoals) {
      const note = notes.find(
        (n) => n.basename.toLowerCase() === goalName.toLowerCase()
      );
      if (note) {
        const g = extractGoalData(note);
        if (g) goals.push(g);
      }
    }
  } else {
    for (const note of notes) {
      const g = extractGoalData(note);
      if (g) goals.push(g);
    }
  }

  let filtered = filterByRank(goals, blockData.rankMin, blockData.rankMax);
  filtered.sort((a, b) => a.rank - b.rank);
  return filtered;
}

function extractGoalData(note) {
  try {
    const fm = note.frontmatter;
    if (!fm || typeof fm !== "object") return null;
    if (!noteHasTag(note, "goal") && !noteHasTag(note, "goal-future")) {
      return null;
    }

    const currentGoal = fm.currentGoal || fm["current-goal"] || note.basename;
    const rawHabits = fm.habits || [];
    const habits = Array.isArray(rawHabits)
      ? rawHabits.map((h) => wikiLinkTarget(h))
      : [];

    return {
      file: note.path,
      currentGoal,
      why: fm.why || fm.Why || fm["Why?"] || "",
      nextGoals: fm.nextGoals || fm["next-goals"] || "",
      rank: fm.rank || 0,
      cover: fm.cover || "",
      status: fm.status || fm.Status || "",
      laterLifeGoal: fm.laterLifeGoal || fm["later-life-goal"] || false,
      habits,
    };
  } catch {
    return null;
  }
}

function filterByRank(items, rankMin, rankMax) {
  return items.filter((item) => {
    const rank = item.rank || 0;
    if (rankMin !== undefined && rank < rankMin) return false;
    if (rankMax !== undefined && rank > rankMax) return false;
    return true;
  });
}
