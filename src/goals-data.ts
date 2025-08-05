import { App, TFile } from 'obsidian';

interface GoalData {
  file: string;
  currentGoal: string;
  why: string;
  nextGoals: string;
  rank: number;
  cover: string;
  status: string;
  laterLifeGoal: boolean;
  habits: string[];
}

interface Settings {
  // Relevant settings
}

export async function getGoalsData(app: App, settings: Settings, blockData: any = {}): Promise<GoalData[]> {
  const goals: GoalData[] = [];
  const files = app.vault.getMarkdownFiles();

  if (blockData.customGoals && blockData.customGoals.length > 0) {
    for (const goalName of blockData.customGoals) {
      const goalFile = files.find((file) => file.basename.toLowerCase() === goalName.toLowerCase());
      if (goalFile) {
        const goalData = extractGoalData(app, goalFile);
        if (goalData) {
          goals.push(goalData);
        }
      } else {
        console.log(`[GoalsData] Goal file not found: ${goalName}`);
      }
    }
  } else {
    for (const file of files) {
      const goalData = extractGoalData(app, file);
      if (goalData) {
        goals.push(goalData);
      }
    }
  }

  let filteredGoals = filterByRank(goals, blockData.rankMin, blockData.rankMax);
  filteredGoals.sort((a, b) => a.rank - b.rank);

  return filteredGoals;
}

function extractGoalData(app: App, file: TFile): GoalData | null {
  try {
    const cache = app.metadataCache.getCache(file.path);
    if (!cache?.frontmatter) return null;

    const fm = cache.frontmatter;
    const tags = fm.tags || fm.tag || [];
    const hasGoalTag = Array.isArray(tags) ? tags.some((tag) => tag === "goal") : tags === "goal";
    if (!hasGoalTag) return null;

    const currentGoal = fm.currentGoal || fm["current-goal"] || file.basename;

    const goalData: GoalData = {
      file: file.path,
      currentGoal,
      why: fm.why || fm.Why || fm["Why?"] || "",
      nextGoals: fm.nextGoals || fm["next-goals"] || "",
      rank: fm.rank || 0,
      cover: fm.cover || "",
      status: fm.status || "",
      laterLifeGoal: fm.laterLifeGoal || fm["later-life-goal"] || false,
      habits: fm.habits || []
    };

    return goalData;
  } catch (error) {
    console.error(`Error processing file ${file.path}:`, error);
    return null;
  }
}

function filterByRank(items: GoalData[], rankMin?: number, rankMax?: number): GoalData[] {
  return items.filter((item) => {
    const rank = item.rank || 0;
    if (rankMin !== undefined && rank < rankMin) return false;
    if (rankMax !== undefined && rank > rankMax) return false;
    return true;
  });
}