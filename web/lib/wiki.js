/** Extract note name from a wiki-link string or `[[note|alias]]` fragment. */
export function wikiLinkTarget(entry) {
  const match = String(entry).match(/\[\[(.*?)\]\]/);
  if (!match) return String(entry).trim();
  const inner = match[1];
  return inner.split("|")[0].trim();
}

export function wikiLinkPattern(noteName) {
  const escaped = noteName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\[\\[${escaped}(?:\\|.*?)?\\]\\]`, "i");
}
