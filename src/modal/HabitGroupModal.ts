import { App, Modal, Component } from 'obsidian';
import { getHabitStats, createHabitTable } from '../render';


export class HabitGroupOverviewModal extends Modal {
  groupName: string;
  members: string[];
  habitData: any;
  selectedHabit: string | null;
  stats: any;
  component: Component;

  constructor(app: App, groupName: string, members: string[], habitData: any, selectedHabit?: string | null, stats?: any) {
    super(app);
    this.groupName = groupName;
    this.members = members;
    this.habitData = habitData;
    this.selectedHabit = selectedHabit || null;
    this.stats = stats || {};
    this.component = new Component();
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    if (this.selectedHabit) {
      const breadcrumb = contentEl.createDiv("habit-breadcrumb");
      const groupLink = breadcrumb.createEl("span", { text: this.groupName, cls: "habit-breadcrumb-group" });
      groupLink.style.cursor = "pointer";
      groupLink.onclick = () => {
        this.selectedHabit = null;
        this.onOpen();
      };
      breadcrumb.createEl("span", { text: " › ", cls: "habit-breadcrumb-chevron" });
      breadcrumb.createEl("span", { text: this.selectedHabit, cls: "habit-breadcrumb-habit" });

      const headerDiv = contentEl.createDiv("habit-overview-header");
      headerDiv.createEl("h2", { text: this.selectedHabit });

      const wikiLink = headerDiv.createEl("a", { text: this.selectedHabit, cls: "habit-wiki-link" });
      wikiLink.href = `obsidian://open?vault=${encodeURIComponent(this.app.vault.getName())}&file=${encodeURIComponent(this.selectedHabit)}`;
      wikiLink.setAttribute("style", "margin-left: 10px; text-decoration: none; font-size: 14px; opacity: 0.7;");

      if (Object.keys(this.stats).length > 0) {
        const statsDiv = contentEl.createDiv("habit-overview-stats");
        for (const [key, value] of Object.entries(this.stats)) {
          const row = statsDiv.createDiv("habit-overview-row");
          row.createSpan({ text: `${key}: `, cls: "habit-overview-label" });
          row.createSpan({ text: String(value), cls: "habit-overview-value" });
        }
      } else {
        contentEl.createEl("p", { text: "No stats available for this habit." });
      }

      const habitIdx = this.habitData.habits.indexOf(this.selectedHabit);
      if (habitIdx !== -1) {
        const filteredHabitData = {
          habits: [this.selectedHabit],
          dates: [...this.habitData.dates],
          data: this.habitData.data.map((row: any[]) => [row[0], row[habitIdx + 1]]),
        };

        const filteredBlockData = {
          habits: [this.selectedHabit],
          habitGroups: [],
        };

        const table = createHabitTable(this.app, filteredHabitData, this.app.plugins.plugins["habits-obsidian"]?.settings || {}, filteredBlockData, undefined, "horizontal", false, null, true);
        contentEl.appendChild(table);
      }
    } else if (this.members.length > 1) {
      const headerDiv = contentEl.createDiv("habit-overview-header");
      headerDiv.createEl("h2", { text: `${this.groupName} Group` });

      const wikiLink = headerDiv.createEl("a", { text: this.groupName, cls: "habit-wiki-link" });
      wikiLink.href = `obsidian://open?vault=${encodeURIComponent(this.app.vault.getName())}&file=${encodeURIComponent(this.groupName)}`;
      wikiLink.setAttribute("style", "margin-left: 10px; text-decoration: none; font-size: 14px; opacity: 0.7;");

      contentEl.createEl("p", { text: "Click on any member to view details:", cls: "habit-group-description" });

      const listEl = contentEl.createEl("ul", { cls: "habit-group-list" });
      this.members.forEach((member) => {
        const li = listEl.createEl("li", { cls: "habit-group-list-item" });
        const button = li.createEl("button", { text: member, cls: "habit-group-member" });
        button.onclick = () => {
          const stats = getHabitStats(member, this.habitData, [member]);
          this.selectedHabit = member;
          this.stats = stats;
          this.onOpen();
        };
      });
    } else if (this.members.length === 1) {
      const member = this.members[0];
      const headerDiv = contentEl.createDiv("habit-overview-header");
      headerDiv.createEl("h2", { text: member });

      const wikiLink = headerDiv.createEl("a", { text: member, cls: "habit-wiki-link" });
      wikiLink.href = `obsidian://open?vault=${encodeURIComponent(this.app.vault.getName())}&file=${encodeURIComponent(member)}`;
      wikiLink.setAttribute("style", "margin-left: 10px; text-decoration: none; font-size: 14px; opacity: 0.7;");

      const stats = getHabitStats(member, this.habitData, [member]);
      if (Object.keys(stats).length > 0) {
        const statsDiv = contentEl.createDiv("habit-overview-stats");
        for (const [key, value] of Object.entries(stats)) {
          const row = statsDiv.createDiv("habit-overview-row");
          row.createSpan({ text: `${key}: `, cls: "habit-overview-label" });
          row.createSpan({ text: String(value), cls: "habit-overview-value" });
        }
      } else {
        contentEl.createEl("p", { text: "No stats available for this habit." });
      }
    } else {
      contentEl.createEl("p", { text: "No members in this group." });
    }

    this.modalEl.addClass("habit-group-modal");
  }

  onClose() {
    this.component?.unload();
    this.contentEl.empty();
  }
}