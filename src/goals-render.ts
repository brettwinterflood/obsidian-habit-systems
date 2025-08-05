import { App } from 'obsidian';
import { GoalOverviewModal } from './modal/GoalOverviewModal';
import { getHabitData } from './data';
import { createHabitTable } from './render';

interface Goal {
  currentGoal: string;
  why: string;
  nextGoals: string | string[];
  rank: number;
  cover: string;
  habits: string[];
  file: string;
  // Other fields
}

interface Settings {
  showGoalWhy: boolean;
  showGoalNext: boolean;
  showGoalRank: boolean;
  showGoalCover: boolean;
  showGoalHabits: boolean;
  showGoalHabitTracking: boolean;
  showGoalFileName: boolean;
  // Other settings
}

interface DisplayOptions {
  showWhy: boolean;
  showNext: boolean;
  showRank: boolean;
  showCover: boolean;
  showHabits: boolean;
  showHabitTracking: boolean;
  showFileName: boolean;
}

export async function createGoalsGrid(app: App, goals: Goal[], settings: Settings, blockData: any = {}): Promise<HTMLElement> {
  const container = document.createElement("div");
  container.className = "goals-container";

  const showWhy = blockData.showWhy !== undefined ? blockData.showWhy : settings.showGoalWhy;
  const showNext = blockData.showNext !== undefined ? blockData.showNext : settings.showGoalNext;
  const showRank = blockData.showRank !== undefined ? blockData.showRank : settings.showGoalRank;
  const showCover = blockData.showCover !== undefined ? blockData.showCover : settings.showGoalCover;
  const showHabits = settings.showGoalHabits;
  const showHabitTracking = settings.showGoalHabitTracking;
  const showFileName = settings.showGoalFileName;

  const columns = blockData.columns || settings.goalsColumns;
  container.style.display = "grid";
  container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  container.style.gap = "1rem";
  container.style.padding = "1rem 0";

  if (goals.length === 0) {
    const emptyMessage = container.createEl("div", { text: "No goals found. Make sure you have notes with the 'goal' tag.", cls: "goals-empty-message" });
    emptyMessage.style.gridColumn = `1 / -1`;
    emptyMessage.style.textAlign = "center";
    emptyMessage.style.color = "var(--text-muted)";
    emptyMessage.style.fontStyle = "italic";
    return container;
  }

  for (const goal of goals) {
    const card = await createGoalCard(app, goal, settings, { showWhy, showNext, showRank, showCover, showHabits, showHabitTracking, showFileName });
    container.appendChild(card);
  }

  return container;
}

async function createGoalCard(app: App, goal: Goal, settings: Settings, displayOptions: DisplayOptions): Promise<HTMLElement> {
  const card = document.createElement("div");
  card.className = "goal-card";
  card.style.cssText = `
    border: 1px solid var(--background-modifier-border);
    border-radius: 8px;
    padding: 1rem;
    background: var(--background-primary);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    cursor: pointer;
  `;

  card.addEventListener("mouseenter", () => {
    card.style.transform = "translateY(-2px)";
    card.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "translateY(0)";
    card.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
  });

  card.addEventListener("click", () => {
    new GoalOverviewModal(app, goal, settings).open();
  });

  if (displayOptions.showCover && goal.cover) {
    const coverContainer = card.createEl("div", { cls: "goal-cover" });
    let imageUrl = goal.cover;
    const obsidianImageMatch = goal.cover.match(/!\[\[(.*?)\]\]/);
    if (obsidianImageMatch) {
      const imageName = obsidianImageMatch[1];
      const imageFile = app.vault.getFiles().find((file) => file.name === imageName || file.basename === imageName);
      if (imageFile) {
        imageUrl = app.vault.adapter.getResourcePath(imageFile.path);
      } else {
        const goalFile = app.vault.getAbstractFileByPath(goal.file);
        if (goalFile instanceof TFile && goalFile.parent) {
          const imagePath = `${goalFile.parent.path}/${imageName}`;
          const imageFile2 = app.vault.getAbstractFileByPath(imagePath);
          if (imageFile2 instanceof TFile) {
            imageUrl = app.vault.adapter.getResourcePath(imageFile2.path);
          }
        }
      }
    }

    coverContainer.style.cssText = `
      width: 100%;
      height: 180px;
      background-image: url(${imageUrl});
      background-size: contain;
      background-position: center;
      background-repeat: no-repeat;
      border-radius: 4px;
      margin-bottom: 0.75rem;
    `;
  }

  const title = card.createEl("h3", { cls: "goal-title" });
  title.style.cssText = `
    margin: 0 0 0.25rem 0;
    font-size: 1.1em;
    font-weight: 600;
    color: var(--text-normal);
    line-height: 1.3;
  `;

  const titleText = `🎯 ${goal.currentGoal}`;
  const wikiLinkMatch = titleText.match(/\[\[(.*?)\]\]/);
  if (wikiLinkMatch) {
    const linkContent = wikiLinkMatch[1];
    const [noteName, alias] = linkContent.split("|");
    const displayText = alias || noteName;
    const parts = titleText.split(/\[\[.*?\]\]/);
    const beforeLink = parts[0];
    const afterLink = parts[1] || "";

    if (beforeLink) title.createEl("span", { text: beforeLink });

    const link = title.createEl("a", { text: displayText, cls: "internal-link" });
    link.href = "#";
    link.style.cssText = `
      color: var(--text-normal);
      text-decoration: none;
      font-weight: 600;
    `;
    link.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      app.workspace.openLinkText(noteName, "", false);
    });
    link.addEventListener("mouseenter", () => link.style.textDecoration = "underline");
    link.addEventListener("mouseleave", () => link.style.textDecoration = "none");

    if (afterLink) title.createEl("span", { text: afterLink });
  } else {
    title.textContent = titleText;
  }

  const properties = card.createEl("div", { cls: "goal-properties" });
  properties.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
  `;

  if (displayOptions.showWhy && goal.why) {
    const whyContainer = properties.createEl("div", { cls: "goal-why" });
    whyContainer.style.cssText = `
      font-size: 0.95em;
      color: var(--text-normal);
      line-height: 1.4;
    `;
    const whyLabel = whyContainer.createEl("strong", { text: "Why? " });
    whyLabel.style.color = "var(--text-accent)";
    whyContainer.createEl("span", { text: goal.why });
  }

  if (displayOptions.showHabits && goal.habits && goal.habits.length > 0) {
    const habitsContainer = properties.createEl("div", { cls: "goal-habits" });
    habitsContainer.style.cssText = `
      font-size: 0.85em;
      color: var(--text-muted);
    `;

    const habitsLabel = habitsContainer.createEl("div", { text: "HABITS" });
    habitsLabel.style.cssText = `
      color: black;
      font-size: 0.75em;
      font-weight: 600;
      text-align: center;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    `;

    const habitsList = habitsContainer.createEl("div");
    habitsList.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.25rem;
      margin-top: 0.25rem;
    `;

    goal.habits.forEach((habit) => {
      const match = habit.match(/\[\[(.*?)\]\]/);
      const habitName = match ? match[1] : habit;

      const habitItem = habitsList.createEl("div");
      habitItem.style.cssText = `
        font-size: 0.8em;
        line-height: 1.3;
      `;

      if (match) {
        const link = habitItem.createEl("a", { text: habitName, cls: "internal-link" });
        link.href = `obsidian://open?vault=${encodeURIComponent(app.vault.getName())}&file=${encodeURIComponent(habitName)}`;
        link.style.cssText = `
          color: var(--text-accent);
          text-decoration: none;
        `;
        link.addEventListener("mouseenter", () => link.style.textDecoration = "underline");
        link.addEventListener("mouseleave", () => link.style.textDecoration = "none");
      } else {
        habitItem.textContent = habitName;
      }
    });
  }

  if (displayOptions.showNext && goal.nextGoals) {
    const nextContainer = properties.createEl("div", { cls: "goal-next" });
    nextContainer.style.cssText = `
      font-size: 0.9em;
      color: var(--text-muted);
    `;

    const nextLabel = nextContainer.createEl("div", { text: "NEXT" });
    nextLabel.style.cssText = `
      color: black;
      font-size: 0.75em;
      font-weight: 600;
      text-align: center;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    `;

    let nextGoalsList: string[] = [];
    if (Array.isArray(goal.nextGoals)) {
      nextGoalsList = goal.nextGoals;
    } else if (typeof goal.nextGoals === "string") {
      nextGoalsList = goal.nextGoals.split(",").map((s) => s.trim()).filter((s) => s);
    }

    if (nextGoalsList.length > 0) {
      const nextList = nextContainer.createEl("div");
      nextList.style.cssText = `
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.25rem;
        margin-top: 0.25rem;
      `;

      nextGoalsList.forEach((nextGoal) => {
        const nextItem = nextList.createEl("div");
        nextItem.style.cssText = `
          font-size: 0.8em;
          line-height: 1.3;
        `;

        const wikiLinkMatch = nextGoal.match(/\[\[(.*?)\]\]/);
        if (wikiLinkMatch) {
          const linkContent = wikiLinkMatch[1];
          const [noteName, alias] = linkContent.split("|");
          const displayText = alias || noteName;

          const link = nextItem.createEl("a", { text: displayText, cls: "internal-link" });
          link.href = `obsidian://open?vault=${encodeURIComponent(app.vault.getName())}&file=${encodeURIComponent(noteName)}`;
          link.style.cssText = `
            color: var(--text-accent);
            text-decoration: none;
          `;
          link.addEventListener("mouseenter", () => link.style.textDecoration = "underline");
          link.addEventListener("mouseleave", () => link.style.textDecoration = "none");
        } else {
          nextItem.textContent = nextGoal;
        }
      });
    } else {
      nextContainer.createEl("span", { text: goal.nextGoals });
    }
  }

  if (displayOptions.showHabitTracking && goal.habits && goal.habits.length > 0) {
    try {
      const cleanHabits = goal.habits.map((habit) => {
        const match = habit.match(/\[\[(.*?)\]\]/);
        return match ? match[1] : habit;
      });

      const goalFileName = goal.file.split("/").pop()?.replace(/\.md$/, "") || "";

      const blockData = {
        habits: [],
        habitGroups: [{ name: goalFileName, members: cleanHabits }]
      };

      const habitData = await getHabitData(app, settings, blockData, 5);
      const habitSection = createHabitTable(app, habitData, settings, blockData, undefined, "horizontal", true);
      card.appendChild(habitSection);
    } catch (error) {
      console.error(`Error loading habit data for goal ${goal.currentGoal}:`, error);
    }
  }

  if (displayOptions.showFileName) {
    const goalFileName = goal.file.split("/").pop()?.replace(/\.md$/, "") || "";
    const bottomContainer = card.createEl("div");
    bottomContainer.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 0.75rem;
      gap: 0.5rem;
    `;

    if (displayOptions.showRank && goal.rank !== undefined) {
      const rankDiv = bottomContainer.createEl("div", { text: goal.rank.toString(), cls: "goal-rank-bottom" });
      rankDiv.style.cssText = `
        font-size: 0.9em;
        color: var(--text-muted);
        font-weight: 500;
      `;
    }

    const goalNameDiv = bottomContainer.createEl("div", { text: goalFileName, cls: "goal-name-bottom" });
    goalNameDiv.style.cssText = `
      font-size: 1.2em;
      font-weight: 600;
      color: var(--text-normal);
      line-height: 1.3;
    `;
  }

  return card;
}