import { readFile } from "node:fs/promises";
import { join } from "node:path";
import YAML from "yaml";
import { getGoalsData } from "./goals-data.js";

/**
 * Parse Goals.base and return goals for the primary cards view (Status != Finished).
 */
export async function loadGoalsFromBase(vaultDir, goalsBaseRelPath, notes) {
  const raw = await readFile(join(vaultDir, goalsBaseRelPath), "utf8");
  const doc = YAML.parse(raw);

  const baseFilters = doc?.filters;
  let goals = getGoalsData(notes, {});

  goals = goals.filter((g) => passesBaseFilters(g, baseFilters, notes));

  const cardsView = (doc?.views || []).find(
    (v) => v.type === "cards" && v.name === "Goals"
  );
  if (cardsView?.filters) {
    goals = goals.filter((g) => passesViewFilters(g, cardsView.filters));
  } else {
    goals = goals.filter(
      (g) => String(g.status).toLowerCase() !== "finished"
    );
  }

  goals.sort((a, b) => a.rank - b.rank);
  return { goals, base: doc };
}

function passesBaseFilters(goal, filters, notes) {
  if (!filters) return true;
  const note = notes.find((n) => n.path === goal.file);
  if (!note) return false;
  if (note.basename.startsWith("DATABASES")) return false;
  return noteHasTagGoal(note);
}

function noteHasTagGoal(note) {
  const tags = note.frontmatter.tags || note.frontmatter.tag || [];
  const list = Array.isArray(tags) ? tags : [tags];
  return list.some((t) => t === "goal" || t === "goal-future");
}

function passesViewFilters(goal, filters) {
  const and = filters?.and;
  if (!Array.isArray(and)) return true;
  for (const clause of and) {
    if (typeof clause === "string" && clause.includes('Status != "Finished"')) {
      if (String(goal.status).toLowerCase() === "finished") return false;
    }
    if (clause?.["Status"] && clause["Status"] !== goal.status) {
      /* simple equality only */
    }
  }
  return true;
}
