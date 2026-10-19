import { join } from "node:path";

export function loadConfig(env = process.env) {
  const vaultDir = env.VAULT_DIR || "/home/forge/0_MIND";
  const dailyNotesFolder = normalizeFolder(
    env.DAILY_NOTES_FOLDER || "DIARY/"
  );
  return {
    host: env.HOST || "127.0.0.1",
    port: Number(env.PORT || "8795", 10),
    vaultDir,
    dailyNotesFolder,
    habitsMdPath:
      env.HABITS_MD_PATH ||
      join("DATABASES", "LIFE", "Habits.md"),
    goalsBasePath: env.GOALS_BASE_PATH || "Goals.base",
    dayRange: Number(env.DAY_RANGE || "14", 10),
    showWeekends: env.SHOW_WEEKENDS !== "false",
  };
}

function normalizeFolder(folder) {
  if (!folder.endsWith("/")) return `${folder}/`;
  return folder;
}
