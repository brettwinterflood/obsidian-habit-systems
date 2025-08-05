import { App } from 'obsidian';
import { HabitDetailModal } from './modal/modal';
import { HabitGroupOverviewModal } from './modal/HabitGroupModal';
import { HabitOverviewModal } from './modal/HabitOverviewModal';
import { createTextWithWikiLinks } from './ui-utils';

let tooltipTimeout: number | null = null;
let tooltipDiv: HTMLDivElement | null = null;

function showTooltip(target: HTMLElement, text: string) {
  if (!tooltipDiv) {
    tooltipDiv = document.createElement("div");
    tooltipDiv.className = "habit-tooltip";
    tooltipDiv.style.position = "fixed";
    tooltipDiv.style.zIndex = "9999";
    tooltipDiv.style.background = "var(--background-secondary)";
    tooltipDiv.style.color = "var(--text-normal)";
    tooltipDiv.style.border = "1px solid var(--background-modifier-border)";
    tooltipDiv.style.borderRadius = "4px";
    tooltipDiv.style.padding = "4px 10px";
    tooltipDiv.style.fontSize = "0.95em";
    tooltipDiv.style.pointerEvents = "none";
    tooltipDiv.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
    document.body.appendChild(tooltipDiv);
  }

  tooltipDiv.empty();
  const contextText = text;
  const renderedText = createTextWithWikiLinks(app as App, contextText, "color: var(--text-normal); text-decoration: none;");
  tooltipDiv.appendChild(renderedText);

  const rect = target.getBoundingClientRect();
  tooltipDiv.style.left = `${rect.left + window.scrollX + rect.width / 2}px`;
  tooltipDiv.style.top = `${rect.top + window.scrollY - 32}px`;
  tooltipDiv.style.display = "block";
}

function hideTooltip() {
  if (tooltipDiv) tooltipDiv.style.display = "none";
}

export function isHabitGroup(habitName: string, blockData: any): boolean {
  if (!blockData.habitGroups || !Array.isArray(blockData.habitGroups)) {
    return false;
  }
  return blockData.habitGroups.some((group: any) => group.name === habitName);
}

export function getGroupMembers(habitName: string, blockData: any): string[] | null {
  if (!blockData.habitGroups || !Array.isArray(blockData.habitGroups)) {
    return null;
  }
  const group = blockData.habitGroups.find((group: any) => group.name === habitName);
  return group ? group.members : null;
}

export function getHabitStats(habit: string, habitData: any, members: string[]): any {
  let completed = 0;
  let failed = 0;
  let total = 0;

  for (const row of habitData.data) {
    for (const cell of row.slice(1)) {
      if (cell.habit === habit) {
        total++;
        if (cell.status === "success") completed++;
        if (cell.status === "fail") failed++;
      }
    }
  }

  const stats = {
    Habits: members
  };

  return stats;
}

export function createHabitTable(app: App, habitData: any, settings: any, blockData: any, onRefresh?: () => void, layout = "horizontal", hideFirstColumn = false, singleExpandedGroup: string | null = null, isModal = false): HTMLElement {
  const container = document.createElement("div");
  container.className = "habit-tracker-table-wrapper";

  if (typeof onRefresh === "function") {
    const refreshBtn = document.createElement("button");
    refreshBtn.className = "habit-refresh-btn";
    refreshBtn.title = "Refresh";
    refreshBtn.innerText = "↳";
    refreshBtn.onclick = () => onRefresh();
    container.appendChild(refreshBtn);
  }

  const groupMembersMap: { [key: string]: string[] } = {};
  if (blockData.habitGroups && Array.isArray(blockData.habitGroups)) {
    for (const group of blockData.habitGroups) {
      groupMembersMap[group.name] = group.members;
    }
  }

  const gridContainer = document.createElement("div");
  gridContainer.className = "habit-tracker-table";
  if (hideFirstColumn) {
    gridContainer.classList.add("goal-habit-tracking");
  }
  if (isModal) {
    gridContainer.classList.add("modal-layout");
  }

  if (layout === "horizontal") {
    gridContainer.classList.add("horizontal-layout");

    habitData.habits.forEach((habit: string, habitIdx: number) => {
      if (!hideFirstColumn) {
        const habitNameCell = document.createElement("div");
        habitNameCell.className = "habit-name";
        let displayText = habit;
        let members: string[] = [];
        if (isHabitGroup(habit, blockData)) {
          members = getGroupMembers(habit, blockData) || [];
        }

        habitNameCell.textContent = displayText;
        habitNameCell.style.cursor = "pointer";

        if (isHabitGroup(habit, blockData)) {
          habitNameCell.classList.add("habit-group");
          habitNameCell.title = `Group: ${habit}\n${members.map((m) => `- ${m}`).join("\n")}`;
          habitNameCell.onclick = (e) => {
            e.stopPropagation();
            new HabitGroupOverviewModal(app, habit, members, habitData).open();
          };
        } else {
          habitNameCell.title = habit;
          habitNameCell.onclick = (e) => {
            e.stopPropagation();
            const stats = getHabitStats(habit, habitData, [habit]);
            new HabitOverviewModal(app, habit, stats).open();
          };
        }

        habitNameCell.style.gridRow = `${habitIdx + 1}`;
        habitNameCell.style.gridColumn = "1";
        gridContainer.appendChild(habitNameCell);
      }

      habitData.dates.forEach((date: string, dateIdx: number) => {
        const habitCell = document.createElement("div");
        habitCell.className = "habit-cell";

        const row = habitData.data[dateIdx];
        const habitCellData = row[habitIdx + 1];
        const habitName = habitCellData.habit;

        habitCell.addClass(habitCellData.status);
        habitCell.setAttribute("data-habit", habitName);

        let symbol = "";
        if (habitCellData.status === "success") symbol = "✓";
        else if (habitCellData.status === "fail") symbol = "✗";
        else if (habitCellData.status === "todo") symbol = "-";

        habitCell.textContent = symbol;

        if (settings.enableTooltips && habitCellData.contexts.length > 0) {
          habitCell.title = habitCellData.contexts.join(" | ");
        }

        habitCell.onclick = () => {
          const modal = new HabitDetailModal(app, habitName, date, habitCellData.contexts);
          modal.open();
        };

        habitCell.removeAttribute("title");

        habitCell.onmouseenter = () => {
          if (settings.enableTooltips && habitCellData.contexts.length > 0) {
            tooltipTimeout = window.setTimeout(() => {
              showTooltip(habitCell, habitCellData.contexts.join(" | "));
            }, 2000);
          }
        };

        habitCell.onmouseleave = () => {
          if (tooltipTimeout) {
            clearTimeout(tooltipTimeout);
            tooltipTimeout = null;
          }
          hideTooltip();
        };

        habitCell.style.gridRow = `${habitIdx + 1}`;
        habitCell.style.gridColumn = `${dateIdx + 2}`;
        gridContainer.appendChild(habitCell);
      });
    });

    container.appendChild(gridContainer);
    return container;
  }

  gridContainer.classList.add("vertical-layout");

  habitData.data.forEach((row: any[], dateIdx: number) => {
    const date = row[0];
    const dateCell = document.createElement("div");
    dateCell.className = "habit-name";
    dateCell.textContent = window.moment(date).format("MMM DD");
    dateCell.style.cursor = "pointer";
    dateCell.onclick = () => {
      const notePath = `${settings.dailyNotesFolder}${date}`;
      app.workspace.openLinkText(notePath, "", false);
    };
    gridContainer.appendChild(dateCell);

    for (let i = 1; i < row.length; i++) {
      const habitCell = document.createElement("div");
      habitCell.className = "habit-cell";
      const habitDataItem = row[i];
      const habit = habitDataItem.habit;

      habitCell.addClass(habitDataItem.status);
      habitCell.setAttribute("data-habit", habit);

      let symbol = "";
      if (habitDataItem.status === "success") symbol = "✓";
      else if (habitDataItem.status === "fail") symbol = "✗";
      else if (habitDataItem.status === "todo") symbol = "-";

      habitCell.textContent = symbol;

      if (settings.enableTooltips && habitDataItem.contexts.length > 0) {
        habitCell.title = habitDataItem.contexts.join(" | ");
      }

      habitCell.onclick = () => {
        const modal = new HabitDetailModal(app, habit, date, habitDataItem.contexts);
        modal.open();
      };

      habitCell.removeAttribute("title");

      habitCell.onmouseenter = () => {
        if (settings.enableTooltips && habitDataItem.contexts.length > 0) {
          tooltipTimeout = window.setTimeout(() => {
            showTooltip(habitCell, habitDataItem.contexts.join(" | "));
          }, 2000);
        }
      };

      habitCell.onmouseleave = () => {
        if (tooltipTimeout) {
          clearTimeout(tooltipTimeout);
          tooltipTimeout = null;
        }
        hideTooltip();
      };

      gridContainer.appendChild(habitCell);
    }
  });

  container.appendChild(gridContainer);
  return container;
}

export function createStatsSection(habitData: any): HTMLElement {
  const statsDiv = document.createElement("div");
  statsDiv.className = "habit-stats";

  const totalHabits = habitData.habits.length;
  const totalDays = habitData.dates.length;
  let completedCount = 0;
  let failedCount = 0;

  habitData.data.forEach((row: any[]) => {
    for (let i = 1; i < row.length; i++) {
      if (row[i].status === "success") completedCount++;
      else if (row[i].status === "fail") failedCount++;
    }
  });

  const completionRate = totalHabits * totalDays > 0 ? Math.round((completedCount / (totalHabits * totalDays)) * 100) : 0;

  const completionStat = statsDiv.createDiv("habit-stat");
  completionStat.createDiv("habit-stat-number").textContent = `${completionRate}%`;
  completionStat.createDiv("habit-stat-label").textContent = "Completion Rate";

  const completedStat = statsDiv.createDiv("habit-stat");
  completedStat.createDiv("habit-stat-number").textContent = completedCount.toString();
  completedStat.createDiv("habit-stat-label").textContent = "Completed";

  const streakStat = statsDiv.createDiv("habit-stat");
  streakStat.createDiv("habit-stat-number").textContent = "0"; // TODO: Implement actual streak
  streakStat.createDiv("habit-stat-label").textContent = "Current Streak";

  return statsDiv;
}