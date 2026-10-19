import { randomBytes } from "node:crypto";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

/** Write UTF-8 content atomically (same directory rename). */
export async function atomicWrite(filePath, content) {
  const dir = dirname(filePath);
  await mkdir(dir, { recursive: true });
  const tmp = join(
    dir,
    `.${filePath.split("/").pop()}.${randomBytes(8).toString("hex")}.tmp`
  );
  await writeFile(tmp, content, "utf8");
  await rename(tmp, filePath);
}
