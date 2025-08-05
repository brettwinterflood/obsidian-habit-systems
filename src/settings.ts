import { App, PluginSettingTab, Setting } from 'obsidian';
import HabitTrackerPlugin from './main';

export default class HabitTrackerSettingTab extends PluginSettingTab {
  plugin: HabitTrackerPlugin;

  constructor(app: App, plugin: HabitTrackerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Habit Tracker Settings" });

    new Setting(containerEl)
      .setName("Day Range")
      .setDesc("Number of days to show in the habit tracker")
      .addSlider((slider) =>
        slider
          .setLimits(3, 30, 1)
          .setValue(this.plugin.settings.dayRange)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.dayRange = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Enable Tooltips")
      .setDesc("Show habit context in tooltips when hovering")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableTooltips)
          .onChange(async (value) => {
            this.plugin.settings.enableTooltips = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Show Weekends")
      .setDesc("Include weekends in the habit tracker")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showWeekends)
          .onChange(async (value) => {
            this.plugin.settings.showWeekends = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Daily Notes Folder")
      .setDesc("Folder path for daily notes (e.g., 'Daily Notes/'). Leave blank for root.")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.dailyNotesFolder)
          .onChange(async (value) => {
            this.plugin.settings.dailyNotesFolder = value.endsWith("/") ? value : value + "/";
            await this.plugin.saveSettings();
          })
      );

    containerEl.createEl("h2", { text: "Goals Settings" });

    new Setting(containerEl)
      .setName("Show 'Why' Field")
      .setDesc("Display the 'why' field in goal cards")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showGoalWhy)
          .onChange(async (value) => {
            this.plugin.settings.showGoalWhy = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Show 'Next Goals' Field")
      .setDesc("Display the 'next-goals' field in goal cards")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showGoalNext)
          .onChange(async (value) => {
            this.plugin.settings.showGoalNext = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Show Rank Field")
      .setDesc("Display the 'rank' field in goal cards")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showGoalRank)
          .onChange(async (value) => {
            this.plugin.settings.showGoalRank = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Show Cover")
      .setDesc("Display cover images in goal cards")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showGoalCover)
          .onChange(async (value) => {
            this.plugin.settings.showGoalCover = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Show Habits List")
      .setDesc("Display the list of habits in goal cards")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showGoalHabits)
          .onChange(async (value) => {
            this.plugin.settings.showGoalHabits = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Show Habit Tracking")
      .setDesc("Display habit completion tracking in goal cards")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showGoalHabitTracking)
          .onChange(async (value) => {
            this.plugin.settings.showGoalHabitTracking = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Show Goal File Name")
      .setDesc("Display the goal file name at the bottom of goal cards")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showGoalFileName)
          .onChange(async (value) => {
            this.plugin.settings.showGoalFileName = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Goals Columns")
      .setDesc("Number of columns to display goals in")
      .addSlider((slider) =>
        slider
          .setLimits(1, 5, 1)
          .setValue(this.plugin.settings.goalsColumns)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.goalsColumns = value;
            await this.plugin.saveSettings();
          })
      );

    containerEl.createEl("h3", { text: "Goals Filtering Rules" });

    new Setting(containerEl)
      .setName("Exclude Status Values")
      .setDesc("Goals with these status values will be excluded (comma-separated)")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.goalsExcludeStatus.join(", "))
          .onChange(async (value) => {
            this.plugin.settings.goalsExcludeStatus = value.split(",").map((s) => s.trim()).filter((s) => s);
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Include Only Status Values")
      .setDesc("Only show goals with these status values (comma-separated, leave empty for all)")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.goalsIncludeStatus.join(", "))
          .onChange(async (value) => {
            this.plugin.settings.goalsIncludeStatus = value.split(",").map((s) => s.trim()).filter((s) => s);
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Exclude Later Life Goals")
      .setDesc("Hide goals marked as later-life goals")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.goalsExcludeLaterLife)
          .onChange(async (value) => {
            this.plugin.settings.goalsExcludeLaterLife = value;
            await this.plugin.saveSettings();
          })
      );
  }
}