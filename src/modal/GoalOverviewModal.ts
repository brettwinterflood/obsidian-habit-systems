import { App, Modal, Component } from 'obsidian';
import { getHabitData } from '../data';
import { createHabitTable } from '../render';

interface Goal {
  file: string;
  currentGoal: string;
  why: string;
  nextGoals: string;
  rank: number;
  // Other fields
}

interface Settings {
  // Relevant settings
}

export class GoalOverviewModal extends Modal {
  goal: Goal;
  settings: Settings;
  component: Component;

  constructor(app: App, goal: Goal, settings: Settings) {
    super(app);
    this.goal = goal;
    this.settings = settings;
    this.component = new Component();
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    const headerDiv = contentEl.createDiv("goal-overview-header");
    headerDiv.createEl("h2", { text: `🎯 ${this.goal.currentGoal}` });

    const wikiLink = headerDiv.createEl("a", { text: "Open Goal Note", cls: "goal-wiki-link" });
    wikiLink.href = "#";
    wikiLink.setAttribute("style", "margin-left: 10px; text-decoration: none; font-size: 14px; opacity: 0.7;");
    wikiLink.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.app.workspace.openLinkText(this.goal.file, "", false);
    });

    const propertiesDiv = contentEl.createDiv("goal-overview-properties");

    if (this.goal.why) {
      const whyRow = propertiesDiv.createDiv("goal-overview-row");
      whyRow.createSpan({ text: "Why? ", cls: "goal-overview-label" });
      whyRow.createSpan({ text: this.goal.why, cls: "goal-overview-value" });
    }

    if (this.goal.nextGoals) {
      const nextRow = propertiesDiv.createDiv("goal-overview-row");
      nextRow.createSpan({ text: "🔜 ", cls: "goal-overview-label" });
      nextRow.createSpan({ text: this.goal.nextGoals, cls: "goal-overview-value" });
    }

    if (this.goal.rank) {
      const rankRow = propertiesDiv.createDiv("goal-overview-row");
      rankRow.createSpan({ text: "Rank: ", cls: "goal-overview-label" });
      rankRow.createSpan({ text: this.goal.rank.toString(), cls: "goal-overview-value" });
    }

    const habits = this.getHabitsFromGoal();
    if (habits.length === 0) {
      contentEl.createEl("p", { text: "No habits found for this goal. Add a 'habits' field to the goal note's frontmatter.", cls: "goal-no-habits" });
      return;
    }

    const blockData = {
      habits,
      habitGroups: []
    };

    try {
      const habitData = await getHabitData(this.app, this.settings, blockData);
      if (habitData.habits.length === 0) {
        contentEl.createEl("p", { text: "No valid habits found for this goal.", cls: "goal-no-habits" });
        return;
      }

      const table = createHabitTable(this.app, habitData, this.settings, blockData, undefined, "horizontal", false, null, true);
      contentEl.appendChild(table);
    } catch (error) {
      contentEl.createEl("p", { text: `Error loading habit data: ${error.message}`, cls: "goal-error" });
    }

    this.modalEl.addClass("goal-overview-modal");
  }

  getHabitsFromGoal(): string[] {
    const cache = this.app.metadataCache.getCache(this.goal.file);
    const fm = cache?.frontmatter;
    if (!fm) {
      console.log(`[GoalOverviewModal] No frontmatter found for ${this.goal.file}`);
      return [];
    }

    const habitFields = ["habits", "habit", "goal.habits", "goal-habits"];
    let fieldVal = null;
    let fieldName = "";

    for (const field of habitFields) {
      if (fm[field]) {
        fieldVal = fm[field];
        fieldName = field;
        break;
      }
    }

    if (!fieldVal) {
      console.log(`[GoalOverviewModal] No habits field found in ${this.goal.file}. Available fields:`, Object.keys(fm));
      return [];
    }

    console.log(`[GoalOverviewModal] Found habits in field '${fieldName}':`, fieldVal);

    let wikiLinks: string[] = [];
    if (Array.isArray(fieldVal)) {
      wikiLinks = fieldVal;
    } else if (typeof fieldVal === "string") {
      wikiLinks = fieldVal.split(",").map((s) => s.trim()).filter((s) => s);
    }

    const habits = wikiLinks.map((entry) => {
      const match = String(entry).match(/\[\[(.*?)\]\]/);
      return match ? match[1] : String(entry);
    });

    console.log(`[GoalOverviewModal] Extracted habits:`, habits);
    return habits;
  }

  onClose() {
    this.component?.unload();
    this.contentEl.empty();
  }
}