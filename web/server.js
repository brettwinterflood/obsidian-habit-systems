import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./lib/config.js";
import { VaultService } from "./lib/vault-service.js";
import { HabitLogConflictError } from "./lib/daily-note.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(__dirname, "public");
const config = loadConfig();
const vault = new VaultService(config);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${config.host}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    await serveStatic(res, url.pathname === "/" ? "/index.html" : url.pathname);
  } catch (err) {
    sendJson(res, 500, { error: err.message || String(err) });
  }
});

async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/health") {
    return sendJson(res, 200, { ok: true });
  }
  if (req.method === "GET" && url.pathname === "/api/habits/today") {
    const data = await vault.todayCheckIn();
    return sendJson(res, 200, data);
  }
  if (req.method === "GET" && url.pathname === "/api/habits/history") {
    const days = Number(url.searchParams.get("days") || config.dayRange, 10);
    const data = await vault.history(days);
    return sendJson(res, 200, data);
  }
  if (req.method === "GET" && url.pathname === "/api/goals") {
    const data = await vault.goals();
    return sendJson(res, 200, data);
  }
  if (req.method === "POST" && url.pathname === "/api/habits/log") {
    const body = await readJson(req);
    const habit = body?.habit;
    if (!habit || typeof habit !== "string") {
      return sendJson(res, 400, { error: "habit required" });
    }
    try {
      const result = await vault.toggleHabitToday(habit);
      return sendJson(res, 200, result);
    } catch (err) {
      if (err instanceof HabitLogConflictError) {
        return sendJson(res, 409, { error: err.message });
      }
      throw err;
    }
  }
  sendJson(res, 404, { error: "not found" });
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

async function serveStatic(res, pathname) {
  const safe = pathname.replace(/\.\./g, "");
  const filePath = join(publicDir, safe);
  const ext = extname(filePath);
  const type = mime[ext] || "application/octet-stream";
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

server.listen(config.port, config.host, () => {
  console.log(
    `Habits web listening on http://${config.host}:${config.port} (vault: ${config.vaultDir})`
  );
});
