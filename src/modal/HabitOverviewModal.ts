import { App, Modal } from 'obsidian';

export class HabitOverviewModal extends Modal {
  habit: string;
  stats: any;

  constructor(app: App, habit: string, stats?: any) {
    super(app);
    this.habit = habit;
    this.stats = stats || {};
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    const headerDiv = contentEl.createDiv("habit-overview-header");
    headerDiv.createEl("h2", { text: this.habit });

    const wikiLink = headerDiv.createEl("a", { text: this.habit, cls: "habit-wiki-link" });
    wikiLink.href = `obsidian://open?vault=${encodeURIComponent(this.app.vault.getName())}&file=${encodeURIComponent(this.habit)}`;
    wikiLink.setAttribute("style", "margin-left: 10px; text-decoration: none; font-size: 14px;");

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
  }

  onClose() {
    this.contentEl.empty();
  }
}