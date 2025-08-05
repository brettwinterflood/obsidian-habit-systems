import { App } from 'obsidian';

export function renderWikiLinks(app: App, text: string, container: HTMLElement, linkStyle = "color: var(--text-accent); text-decoration: none;") {
  const wikiLinkRegex = /\[\[(.*?)\]\]/g;
  let lastIndex = 0;
  let match;

  while ((match = wikiLinkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index);
      container.createEl("span", { text: beforeText });
    }

    const linkContent = match[1];
    const [noteName, alias] = linkContent.split("|");
    const displayText = alias || noteName;

    const link = container.createEl("a", { text: displayText, cls: "internal-link" });
    link.href = `obsidian://open?vault=${encodeURIComponent(app.vault.getName())}&file=${encodeURIComponent(noteName)}`;
    link.style.cssText = linkStyle;
    link.addEventListener("mouseenter", () => {
      link.style.textDecoration = "underline";
    });
    link.addEventListener("mouseleave", () => {
      link.style.textDecoration = "none";
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    const afterText = text.slice(lastIndex);
    container.createEl("span", { text: afterText });
  }
}

export function createTextWithWikiLinks(app: App, text: string, linkStyle = "color: var(--text-accent); text-decoration: none;"): HTMLElement {
  const container = document.createElement("span");
  renderWikiLinks(app, text, container, linkStyle);
  return container;
}