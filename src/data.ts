import { App, TFile } from 'obsidian';

interface HabitData {
  habits: string[];
  dates: string[];
  data: any[][];
}

interface BlockData {
  habits: string[];
  habitGroups: { name: string; members: string[] }[];
  // Other fields as needed
}

interface Settings {
  dailyNotesFolder: string;
  showWeekends: boolean;
  // Other settings
}

export async function getHabitData(app: App, settings: Settings, blockData: BlockData, customDayRange?: number): Promise<HabitData> {
  if (!window.moment) {
    throw new Error("Moment.js is not available.");
  }

  const effectiveDayRange = customDayRange || settings.dayRange;
  const startDate = window.moment().subtract(effectiveDayRange - 1, "days");
  const today = window.moment();

  const habits: string[] = [];
  const processedHabits = new Set<string>();

  for (const group of blockData.habitGroups) {
    if (group.members.length > 0) {
      habits.push(group.name);
      group.members.forEach((member) => processedHabits.add(member));
    }
  }

  blockData.habits.forEach((habit) => {
    if (!processedHabits.has(habit)) {
      habits.push(habit);
    }
  });

  const dates: string[] = [];
  for (let i = effectiveDayRange - 1; i >= 0; i--) {
    const date = today.clone().subtract(i, "days");
    if (settings.showWeekends || (date.day() !== 0 && date.day() !== 6)) {
      dates.push(date.format("YYYY-MM-DD"));
    }
  }

  const habitData: any[][] = [];

  for (const date of dates) {
    const possiblePaths = [
      `${settings.dailyNotesFolder}${date}.md`,
      `${settings.dailyNotesFolder}${date}`
    ];

    let file: TFile | null = null;
    for (const path of possiblePaths) {
      const attemptFile = app.vault.getAbstractFileByPath(path);
      if (attemptFile instanceof TFile) {
        file = attemptFile;
        break;
      }
    }

    const row = [date];

    if (file instanceof TFile) {
      try {
        const content = await app.vault.read(file);
        const lines = content.split("\n");

        for (const habit of habits) {
          let status = "neutral";
          const foundContexts: string[] = [];
          const groupMembers = blockData.habitGroups.find((g) => g.name === habit)?.members || [habit];

          for (const line of lines) {
            if (line.includes("\u{1F4DD}")) {
              continue;
            }

            for (const member of groupMembers) {
              const linkPattern = new RegExp(`\\[\\[${member}(?:\\|.*?)?\\]\\]`, "i");
              if (linkPattern.test(line)) {
                const cleanLine = line.replace(/^[\s\-\*]+/, "").trim();
                foundContexts.push(cleanLine);
                if (line.includes("\u{1F51C}")) {
                  status = "todo";
                } else if (line.toLowerCase().includes("\u274C") || line.toLowerCase().includes("fail")) {
                  status = "fail";
                } else {
                  status = "success";
                }
              }
            }
          }

          const uniqueContexts = [...new Set(foundContexts)];
          row.push({ status, contexts: uniqueContexts, habit });
        }
      } catch (error) {
        console.error(`Error reading file ${file.path}: ${error.message}`);
        for (const habit of habits) {
          row.push({ status: "neutral", contexts: [], habit });
        }
      }
    } else {
      for (const habit of habits) {
        row.push({ status: "neutral", contexts: [], habit });
      }
    }

    habitData.push(row);
  }

  return { habits, dates, data: habitData };
}

export function filterByRank(items: any[], rankMin?: number, rankMax?: number): any[] {
  return items.filter((item) => {
    const rank = item.rank || 0;
    if (rankMin !== undefined && rank < rankMin) {
      return false;
    }
    if (rankMax !== undefined && rank > rankMax) {
      return false;
    }
    return true;
  });
}

export function extractHabitDataFromTaggedNotes(app: App, tag: string, rankMin?: number, rankMax?: number) {
  const files = app.vault.getMarkdownFiles();
  const taggedItems: any[] = [];

  for (const file of files) {
    try {
      const cache = app.metadataCache.getCache(file.path);
      if (!cache?.frontmatter) continue;

      const fm = cache.frontmatter;
      const tags = fm.tags || fm.tag || [];
      const hasTag = Array.isArray(tags) ? tags.some((t) => t === tag) : tags === tag;
      if (!hasTag) continue;

      const itemName = fm.name || fm.habit || fm.goal || file.basename;
      const rank = fm.rank || 0;
      const habits = fm.habits || [];

      if (habits.length > 0) {
        const habitNames = habits.map((entry: string) => {
          const match = String(entry).match(/\[\[(.*?)\]\]/);
          return match ? match[1] : String(entry);
        });
        taggedItems.push({
          name: itemName,
          rank,
          habits: habitNames
        });
      }
    } catch (error) {
      console.error(`Error processing ${tag} file ${file.path}:`, error);
    }
  }

  const filteredItems = filterByRank(taggedItems, rankMin, rankMax);
  filteredItems.sort((a, b) => a.rank - b.rank);

  const individualHabits: string[] = [];
  const habitGroups: { name: string; members: string[] }[] = [];

  for (const taggedItem of filteredItems) {
    if (taggedItem.habits.length === 1) {
      individualHabits.push(taggedItem.habits[0]);
    } else if (taggedItem.habits.length > 1) {
      habitGroups.push({
        name: taggedItem.name,
        members: taggedItem.habits
      });
    }
  }

  return {
    habits: individualHabits,
    habitGroups
  };
}