import { App, Modal, MarkdownRenderer, Component } from 'obsidian';

export class HabitDetailModal extends Modal {
  habit: string;
  date: string;
  contexts: string[];
  component: Component;

  constructor(app: App, habit: string, date: string, contexts: string[]) {
    super(app);
    this.habit = habit;
    this.date = date;
    this.contexts = contexts;
    this.component = new Component();
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: `${this.habit} - ${this.date}` });

    const contextDiv = contentEl.createDiv("habit-contexts");
    if (this.contexts.length > 0) {
      const contextList = contextDiv.createEl("ul");
      for (const context of this.contexts) {
        const li = contextList.createEl("li");
        await MarkdownRenderer.render(this.app, context, li, "", this.component);
      }
    } else {
      contextDiv.createEl("p", { text: "No context found for this habit on this date." });
    }

    const buttonDiv = contentEl.createDiv("habit-actions");
    const openNoteBtn = buttonDiv.createEl("button", { text: "Open Daily Note", cls: "habit-open-note-btn" });
    openNoteBtn.onclick = () => {
      const notePath = `MISC/diary/${this.date}`;
      this.app.workspace.openLinkText(notePath, "", false);
      this.close();
    };

    this.modalEl.addClass("habit-detail-modal");
  }

  onClose() {
    const { contentEl } = this;
    this.component?.unload();
    contentEl.empty();
  }
}