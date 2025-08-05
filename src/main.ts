import { Plugin, PluginSettingTab, App, Modal, Notice, MarkdownView, TFile, Setting, MarkdownRenderer, Component } from 'obsidian';
import HabitTrackerSettingTab from './settings';
import { getHabitData, extractHabitDataFromTaggedNotes } from './data';
import { createHabitTable, createStatsSection } from './render';
import { getGoalsData } from './goals-data';
import { createGoalsGrid } from './goals-render';
import { addStyles } from './styles';

interface HabitTrackerSettings {
  dayRange: number;
  enableTooltips: boolean;
  showWeekends: boolean;
  dailyNotesFolder: string;
  showGoalWhy: boolean;
  showGoalNext: boolean;
  showGoalRank: boolean;
  showGoalCover: boolean;
  showGoalHabits: boolean;
  showGoalHabitTracking: boolean;
  showGoalFileName: boolean;
  goalsColumns: number;
  goalsExcludeStatus: string[];
  goalsIncludeStatus: string[];
  goalsExcludeLaterLife: boolean;
  showSummaryByDefault?: boolean; // Added based on reference in code
}

const DEFAULT_SETTINGS: HabitTrackerSettings = {
  dayRange: 7,
  enableTooltips: true,
  showWeekends: true,
  dailyNotesFolder: "MISC/diary/",
  showGoalWhy: true,
  showGoalNext: true,
  showGoalRank: true,
  showGoalCover: true,
  showGoalHabits: true,
  showGoalHabitTracking: true,
  showGoalFileName: true,
  goalsColumns: 3,
  goalsExcludeStatus: ["Done", "Paused"],
  goalsIncludeStatus: [],
  goalsExcludeLaterLife: true,
  showSummaryByDefault: false, // Assumed default
};

export default class HabitTrackerPlugin extends Plugin {
  settings: HabitTrackerSettings;

  async onload() {
    await this.loadSettings();

    this.registerMarkdownCodeBlockProcessor("habits", (source, el, ctx) => {
      this.renderHabitTracker(source, el, ctx);
    });

    this.registerMarkdownCodeBlockProcessor("goals", (source, el, ctx) => {
      this.renderGoalsTracker(source, el, ctx);
    });

    this.addSettingTab(new HabitTrackerSettingTab(this.app, this));

    addStyles();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  getHabitsFromProps(filePath: string, frontmatterField: string): string[] {
    const cache = this.app.metadataCache.getCache(filePath);
    const fm = cache?.frontmatter;
    if (!fm || !fm[frontmatterField]) {
      return [];
    }
    const fieldVal = fm[frontmatterField];
    let wikiLinks: string[] = [];
    if (Array.isArray(fieldVal)) {
      wikiLinks = fieldVal;
    } else if (typeof fieldVal === "string") {
      wikiLinks = fieldVal.split(",").map((s) => s.trim()).filter((s) => s);
    }
    return wikiLinks.map((entry) => {
      const match = String(entry).match(/\[\[(.*?)\]\]/);
      return match ? match[1] : String(entry);
    });
  }

  async renderHabitTracker(source: string, container: HTMLElement, ctx: any) {
    container.empty();
    const wrapper = container.createDiv("habit-tracker-container");

    try {
      if (!window.moment) {
        throw new Error("Moment.js is not available. Ensure it is loaded in the Obsidian environment.");
      }

      const blockData: any = { habits: [], habitGroups: [], groupSources: [], expandedGroupSources: [] };
      const lines = source.split("\n").map((line) => line.trim()).filter((line) => line);

      let sourceType: string | undefined;
      let frontmatterField = "habits";
      let layout = "horizontal";
      let showSummary: boolean | undefined;
      let dayRange: number | undefined;
      let rankMin: number | undefined;
      let rankMax: number | undefined;
      let tag = "habit";
      const groupLines: string[] = [];
      const habitLines: string[] = [];
      const groupSources: string[] = [];
      const expandedGroupSources: string[] = [];

      for (const line of lines) {
        if (line.match(/^source\s*:/i)) {
          sourceType = line.split(":")[1].trim().toLowerCase();
          continue;
        }
        if (line.match(/^field\s*:/i)) {
          frontmatterField = line.split(":")[1].trim();
          continue;
        }
        if (line.match(/^layout\s*:/i)) {
          const val = line.split(":")[1].trim().toLowerCase();
          layout = val === "vertical" ? "vertical" : "horizontal";
          continue;
        }
        if (line.match(/^summary\s*:/i)) {
          const val = line.split(":")[1].trim().toLowerCase();
          showSummary = val === "true";
          continue;
        }
        if (line.match(/^groups\s*:/i)) {
          const groupsStr = line.split(":")[1].trim();
          if (groupsStr) {
            const groups = groupsStr.split(",").map((g) => g.trim()).filter((g) => g);
            groupSources.push(...groups);
          }
          continue;
        }
        if (line.match(/^groups_expanded\s*:/i)) {
          const expandedStr = line.split(":")[1].trim();
          if (expandedStr) {
            const expanded = expandedStr.split(",").map((g) => g.trim()).filter((g) => g);
            expandedGroupSources.push(...expanded);
          }
          continue;
        }
        if (line.match(/^days\s*:/i)) {
          const daysStr = line.split(":")[1].trim();
          if (daysStr) {
            const days = parseInt(daysStr, 10);
            if (!isNaN(days) && days > 0) {
              dayRange = days;
            }
          }
          continue;
        }
        if (line.match(/^rank_min\s*:/i)) {
          const val = line.split(":")[1].trim();
          const rankMinVal = parseInt(val, 10);
          if (!isNaN(rankMinVal) && rankMinVal >= 0) {
            rankMin = rankMinVal;
          }
          continue;
        }
        if (line.match(/^rank_max\s*:/i)) {
          const val = line.split(":")[1].trim();
          const rankMaxVal = parseInt(val, 10);
          if (!isNaN(rankMaxVal) && rankMaxVal >= 0) {
            rankMax = rankMaxVal;
          }
          continue;
        }
        if (line.match(/^tag\s*:/i)) {
          tag = line.split(":")[1].trim();
          continue;
        }
        if (sourceType !== "groups_tag") {
          if (line.includes(":")) {
            groupLines.push(line);
          } else {
            habitLines.push(line);
          }
        }
      }

      if (showSummary === undefined) {
        showSummary = this.settings.showSummaryByDefault;
      }

      blockData.groupSources = groupSources;
      blockData.expandedGroupSources = expandedGroupSources;
      blockData.tag = tag;

      if (groupSources.length > 0 || expandedGroupSources.length > 0) {
        const files = this.app.vault.getMarkdownFiles();
        const validationErrors: string[] = [];

        for (const groupName of groupSources) {
          const groupFile = files.find((file) => file.basename.toLowerCase() === groupName.toLowerCase());
          if (groupFile) {
            const members = this.getHabitsFromProps(groupFile.path, frontmatterField);
            if (members.length > 0) {
              blockData.habitGroups.push({ name: groupName, members });
            } else {
              validationErrors.push(`Group "${groupName}" found but has no habits in "${frontmatterField}" field`);
            }
          } else {
            validationErrors.push(`Group "${groupName}" not found (no note with this name exists)`);
          }
        }

        for (const groupName of expandedGroupSources) {
          const groupFile = files.find((file) => file.basename.toLowerCase() === groupName.toLowerCase());
          if (groupFile) {
            const members = this.getHabitsFromProps(groupFile.path, frontmatterField);
            if (members.length > 0) {
              blockData.habits.push(...members);
            } else {
              validationErrors.push(`Expanded group "${groupName}" found but has no habits in "${frontmatterField}" field`);
            }
          } else {
            validationErrors.push(`Expanded group "${groupName}" not found (no note with this name exists)`);
          }
        }

        if (validationErrors.length > 0) {
          const errorContainer = wrapper.createDiv("habit-validation-errors");
          errorContainer.style.cssText = `
            margin-top: 8px;
            padding: 8px 12px;
            background: var(--background-modifier-error);
            border: 1px solid var(--text-error);
            border-radius: 4px;
            font-size: 0.8em;
            color: var(--text-error);
          `;
          const errorTitle = errorContainer.createEl("div", { text: "Group validation errors:", cls: "habit-error-title" });
          errorTitle.style.cssText = `font-weight: bold; margin-bottom: 4px;`;
          validationErrors.forEach((error) => {
            const errorItem = errorContainer.createEl("div", { text: `\u2022 ${error}`, cls: "habit-error-item" });
            errorItem.style.cssText = `margin-left: 8px; line-height: 1.3;`;
          });
        }
      }

      if (sourceType === "note") {
        const filePath = ctx.sourcePath;
        const fileNameWithExt = filePath.split("/").pop() || filePath;
        const fileName = fileNameWithExt.replace(/\.md$/, "");
        blockData.habits = [fileName];
      } else if (sourceType === "props") {
        const filePath = ctx.sourcePath;
        const habits = this.getHabitsFromProps(filePath, frontmatterField);
        if (habits.length === 0) {
          wrapper.createEl("p", { text: `No front matter field '${frontmatterField}' found in this note.`, cls: "habit-error" });
          return;
        }
        blockData.habits = habits;
      } else if (sourceType === "groups_tag") {
        const taggedData = extractHabitDataFromTaggedNotes(this.app, tag, rankMin, rankMax);
        if (taggedData.habits.length === 0 && taggedData.habitGroups.length === 0) {
          const rankFilterText = rankMin !== undefined || rankMax !== undefined ? ` with rank filter (min: ${rankMin ?? "none"}, max: ${rankMax ?? "none"})` : "";
          wrapper.createEl("p", { text: `No items found with "${tag}" tag${rankFilterText}.`, cls: "habit-error" });
          const debugInfo = wrapper.createEl("div", { cls: "habit-debug-info" });
          debugInfo.style.cssText = `
            margin-top: 8px;
            padding: 8px 12px;
            background: var(--background-secondary);
            border: 1px solid var(--background-modifier-border);
            border-radius: 4px;
            font-size: 0.8em;
            color: var(--text-muted);
            font-family: monospace;
          `;
          debugInfo.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 4px;">Debug Info:</div>
            <div>\u2022 Looking for notes with tag: "${tag}"</div>
            <div>\u2022 Rank filter: min=${rankMin ?? "none"}, max=${rankMax ?? "none"}</div>
            <div>\u2022 Total markdown files in vault: ${this.app.vault.getMarkdownFiles().length}</div>
            <div>\u2022 Files with "${tag}" tag: ${this.app.vault.getMarkdownFiles().filter((file) => {
              const cache = this.app.metadataCache.getCache(file.path);
              const fm = cache?.frontmatter;
              const tags = fm?.tags || fm?.tag || [];
              return Array.isArray(tags) ? tags.some((t) => t === tag) : tags === tag;
            }).length}</div>
            <div style="margin-top: 4px; font-style: italic;">Check that your notes have: tags: ${tag} and a habits: field in frontmatter</div>
          `;
          return;
        }
        blockData.habits = taggedData.habits;
        blockData.habitGroups = taggedData.habitGroups;
      } else {
        for (const line of groupLines) {
          const [groupName, membersStr] = line.split(":").map((s) => s.trim());
          if (groupName && membersStr) {
            const members = membersStr.split(",").map((m) => m.trim()).filter((m) => m);
            if (members.length > 0) {
              blockData.habitGroups.push({ name: groupName, members });
            }
          }
        }
        for (const line of habitLines) {
          blockData.habits.push(line);
        }
      }

      if (blockData.habits.length === 0 && blockData.habitGroups.length === 0) {
        wrapper.createEl("p", { text: "No habits or groups defined in the code block.", cls: "habit-error" });
        const debugInfo = wrapper.createEl("div", { cls: "habit-debug-info" });
        debugInfo.style.cssText = `
          margin-top: 8px;
          padding: 8px 12px;
          background: var(--background-secondary);
          border: 1px solid var(--background-modifier-border);
          border-radius: 4px;
          font-size: 0.8em;
          color: var(--text-muted);
          font-family: monospace;
        `;
        debugInfo.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 4px;">Debug Info:</div>
          <div>\u2022 Source type: ${sourceType || "not specified"}</div>
          <div>\u2022 Tag: ${tag}</div>
          <div>\u2022 Frontmatter field: ${frontmatterField}</div>
          <div>\u2022 Group sources: ${groupSources.length > 0 ? groupSources.join(", ") : "none"}</div>
          <div>\u2022 Expanded group sources: ${expandedGroupSources.length > 0 ? expandedGroupSources.join(", ") : "none"}</div>
          <div>\u2022 Rank filter: min=${rankMin ?? "none"}, max=${rankMax ?? "none"}</div>
          ${sourceType === "groups_tag" ? '<div style="color: var(--text-muted); font-style: italic;">\u2022 Manual habit/group lines are ignored when using groups_tag source</div>' : `<div>\u2022 Manual habit lines: ${habitLines.length}</div><div>\u2022 Manual group lines: ${groupLines.length}</div>`}
          <div style="margin-top: 4px; font-style: italic;">
            ${sourceType === "groups_tag" ? `Check that your notes have: tags: ${tag} and a habits: field in frontmatter` : "Add habits or groups to the code block, or specify a source type (note, props, groups_tag)"}
          </div>
        `;
        return;
      }

      const habitData = await getHabitData(this.app, this.settings, blockData, dayRange);

      if (habitData.habits.length === 0) {
        wrapper.createEl("p", { text: "No valid habits found in the code block.", cls: "habit-error" });
        return;
      }

      const rerender = async () => {
        wrapper.empty();
        await this.renderHabitTracker(source, container, ctx);
      };

      let singleExpandedGroup = null;
      if (blockData.expandedGroupSources && blockData.expandedGroupSources.length === 1 && (!blockData.habitGroups || blockData.habitGroups.length === 0)) {
        singleExpandedGroup = blockData.expandedGroupSources[0];
      }

      const table = createHabitTable(this.app, habitData, this.settings, blockData, rerender, layout, false, singleExpandedGroup);
      wrapper.appendChild(table);

      if (showSummary) {
        const stats = createStatsSection(habitData);
        wrapper.appendChild(stats);
      }
    } catch (error) {
      wrapper.createEl("p", { text: `Error loading habit data: ${error.message}`, cls: "habit-error" });
      new Notice(`Habit Tracker Error: ${error.message}`);
    }
  }

  async renderGoalsTracker(source: string, container: HTMLElement, ctx: any) {
    container.empty();
    const wrapper = container.createDiv("goals-tracker-container");

    try {
      const blockData: any = {};
      const lines = source.split("\n").map((line) => line.trim()).filter((line) => line);

      for (const line of lines) {
        if (line.match(/^show_why\s*:/i)) {
          const val = line.split(":")[1].trim().toLowerCase();
          blockData.showWhy = val === "true";
          continue;
        }
        if (line.match(/^show_next\s*:/i)) {
          const val = line.split(":")[1].trim().toLowerCase();
          blockData.showNext = val === "true";
          continue;
        }
        if (line.match(/^show_rank\s*:/i)) {
          const val = line.split(":")[1].trim().toLowerCase();
          blockData.showRank = val === "true";
          continue;
        }
        if (line.match(/^show_cover\s*:/i)) {
          const val = line.split(":")[1].trim().toLowerCase();
          blockData.showCover = val === "true";
          continue;
        }
        if (line.match(/^columns\s*:/i)) {
          const val = line.split(":")[1].trim();
          const columns = parseInt(val, 10);
          if (!isNaN(columns) && columns > 0 && columns <= 5) {
            blockData.columns = columns;
          }
          continue;
        }
        if (line.match(/^goals\s*:/i)) {
          const goalsStr = line.split(":")[1].trim();
          if (goalsStr) {
            const goals = goalsStr.split(",").map((g) => g.trim()).filter((g) => g);
            blockData.customGoals = goals;
          }
          continue;
        }
        if (line.match(/^rank_min\s*:/i)) {
          const val = line.split(":")[1].trim();
          const rankMin = parseInt(val, 10);
          if (!isNaN(rankMin) && rankMin >= 0) {
            blockData.rankMin = rankMin;
          }
          continue;
        }
        if (line.match(/^rank_max\s*:/i)) {
          const val = line.split(":")[1].trim();
          const rankMax = parseInt(val, 10);
          if (!isNaN(rankMax) && rankMax >= 0) {
            blockData.rankMax = rankMax;
          }
          continue;
        }
      }

      const goals = await getGoalsData(this.app, this.settings, blockData);
      const goalsGrid = await createGoalsGrid(this.app, goals, this.settings, blockData);
      wrapper.appendChild(goalsGrid);
    } catch (error) {
      wrapper.createEl("p", { text: `Error loading goals data: ${error.message}`, cls: "goals-error" });
      new Notice(`Goals Tracker Error: ${error.message}`);
    }
  }
}