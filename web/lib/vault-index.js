import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import matter from "gray-matter";

/** @typedef {{ path: string, basename: string, frontmatter: Record<string, unknown> }} VaultNote */

/**
 * @param {string} vaultDir
 * @returns {Promise<VaultNote[]>}
 */
export async function listMarkdownNotes(vaultDir) {
  const notes = [];
  await walk(vaultDir, vaultDir, notes);
  return notes;
}

async function walk(root, dir, out) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(root, full, out);
      continue;
    }
    if (!entry.name.endsWith(".md")) continue;
    const rel = relative(root, full).replace(/\\/g, "/");
    let frontmatter = {};
    try {
      const raw = await readFile(full, "utf8");
      const parsed = matter(raw);
      frontmatter = parsed.data || {};
    } catch {
      /* keep empty fm */
    }
    const base = entry.name.replace(/\.md$/, "");
    out.push({ path: rel, basename: base, frontmatter });
  }
}

/**
 * @param {VaultNote} note
 * @param {string} tag
 */
export function noteHasTag(note, tag) {
  const tags = note.frontmatter.tags || note.frontmatter.tag || [];
  if (Array.isArray(tags)) return tags.some((t) => t === tag);
  return tags === tag;
}

/**
 * @param {VaultNote[]} notes
 * @param {string} basename
 */
export function findNoteByBasename(notes, basename) {
  return notes.find(
    (n) => n.basename.toLowerCase() === basename.toLowerCase()
  );
}
