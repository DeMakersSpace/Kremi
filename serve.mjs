import http from "node:http";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const port = Number(process.env.PORT || 3001);
const owner = process.env.GITHUB_OWNER || "DeMakersSpace";
const repo = process.env.GITHUB_REPO || "Kremi";
const branch = process.env.GITHUB_BRANCH || "main";
const githubToken = process.env.GITHUB_TOKEN || "";
const adminPassword = process.env.KREMI_ADMIN_PASSWORD || "";

const sessions = new Map();
const sessionTtlMs = 1000 * 60 * 60 * 12;

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".xml": "application/xml; charset=utf-8",
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    ...headers,
  });
  res.end(body);
}

function sendJson(res, status, value, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    ...headers,
  });
  res.end(JSON.stringify(value));
}

function parseCookies(cookieHeader = "") {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const idx = part.indexOf("=");
        const key = idx >= 0 ? part.slice(0, idx) : part;
        const value = idx >= 0 ? part.slice(idx + 1) : "";
        return [key, decodeURIComponent(value)];
      }),
  );
}

function isAuthed(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  const token = cookies.kremi_admin || "";
  const expires = sessions.get(token);
  if (!expires) return false;
  if (expires < Date.now()) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function createSession() {
  const token = randomBytes(32).toString("base64url");
  sessions.set(token, Date.now() + sessionTtlMs);
  return token;
}

async function readBody(req, limit = 10 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new Error("Request body too large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "seasonal-crepe";
}

function mimeExt(type, fallback = ".jpg") {
  const t = (type || "").toLowerCase();
  if (t.includes("jpeg")) return ".jpg";
  if (t.includes("png")) return ".png";
  if (t.includes("webp")) return ".webp";
  if (t.includes("gif")) return ".gif";
  return fallback;
}

function base64FromData(value) {
  if (!value) return "";
  const raw = value.includes(",") ? value.split(",").pop() : value;
  return raw.replace(/\s+/g, "");
}

async function githubJson(pathName, body, message) {
  const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${pathName}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      message,
      branch,
      ...body,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `GitHub API error (${response.status})`);
  }
  return data;
}

async function getGitHubSha(pathName) {
  const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${pathName}?ref=${encodeURIComponent(branch)}`, {
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `GitHub lookup failed (${response.status})`);
  }
  const data = await response.json();
  return data.sha || null;
}

async function publishSeasonal(payload) {
  if (!githubToken) throw new Error("Server missing GITHUB_TOKEN");
  if (!owner || !repo) throw new Error("Server missing GitHub repo configuration");
  const items = Array.isArray(payload.items) ? payload.items : [];
  if (!items.length) throw new Error("No seasonal items provided");

  const published = [];
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i] || {};
    if (!item.name || !item.imageData) throw new Error(`Item ${i + 1} is missing a name or image`);
    const ext = mimeExt(item.mimeType, path.extname(item.imageName || "") || ".jpg");
    const imagePath = `seasonal/${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(i + 1).padStart(2, "0")}-${slugify(item.name)}${ext}`;
    await githubJson(
      imagePath,
      { content: base64FromData(item.imageData) },
      `Add seasonal image: ${item.name}`,
    );
    published.push({
      name: item.name,
      badge: item.badge || "",
      description: item.description || "",
      price: item.price || "",
      alt: item.alt || `${item.name} seasonal crepe`,
      image: imagePath,
    });
  }

  const seasonalPayload = {
    eyebrow: payload.eyebrow || "Seasonal Crepes",
    title: payload.title || "Fresh flavours, here for a season",
    description: payload.description || "",
    items: published,
  };

  const seasonalSha = await getGitHubSha("seasonal-crepes.json");
  const seasonalContent = Buffer.from(JSON.stringify(seasonalPayload, null, 2) + "\n", "utf8").toString("base64");
  const result = await githubJson(
    "seasonal-crepes.json",
    { content: seasonalContent, sha: seasonalSha || undefined },
    `Update seasonal crepes: ${published.map((item) => item.name).join(", ")}`,
  );

  return {
    commitUrl: result?.commit?.html_url || "",
    count: published.length,
  };
}

const server = http.createServer(async (req, res) => {
  let urlPath;
  try { urlPath = decodeURIComponent((req.url || "/").split("?")[0]); } catch { return send(res, 400, "Invalid URL"); }

  if (req.method === "GET" && urlPath === "/admin-login.html") {
    return serveStatic(res, "admin-login.html");
  }

  if (req.method === "GET" && urlPath === "/seasonal-admin.html") {
    if (!isAuthed(req)) {
      res.writeHead(302, { Location: "/admin-login.html" });
      return res.end();
    }
    return serveStatic(res, "seasonal-admin.html");
  }

  if (req.method === "GET" && urlPath === "/api/status") {
    return sendJson(res, 200, { editorConfigured: Boolean(adminPassword && githubToken) });
  }

  if (req.method === "GET" && urlPath === "/api/me") {
    return sendJson(res, isAuthed(req) ? 200 : 401, { authenticated: isAuthed(req) });
  }

  if (req.method === "POST" && urlPath === "/api/login") {
    try {
      const body = JSON.parse(await readBody(req));
      if (!adminPassword || body.password !== adminPassword) {
        return sendJson(res, 401, { ok: false, error: "Invalid password" });
      }
      const token = createSession();
      return sendJson(
        res,
        200,
        { ok: true },
        { "Set-Cookie": `kremi_admin=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${sessionTtlMs / 1000}` },
      );
    } catch (error) {
      return sendJson(res, 400, { ok: false, error: error.message || "Bad request" });
    }
  }

  if (req.method === "POST" && urlPath === "/api/logout") {
    const cookie = parseCookies(req.headers.cookie || "").kremi_admin || "";
    if (cookie) sessions.delete(cookie);
    return sendJson(res, 200, { ok: true }, { "Set-Cookie": "kremi_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0" });
  }

  if (req.method === "POST" && urlPath === "/api/publish-seasonal") {
    if (!isAuthed(req)) return sendJson(res, 401, { ok: false, error: "Unauthorized" });
    try {
      const payload = JSON.parse(await readBody(req, 25 * 1024 * 1024));
      const result = await publishSeasonal(payload);
      return sendJson(res, 200, { ok: true, ...result });
    } catch (error) {
      return sendJson(res, 400, { ok: false, error: error.message || "Publish failed" });
    }
  }

  return serveStatic(res, urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, ""));
});

async function serveStatic(res, relativePath) {
  const filePath = path.resolve(root, relativePath);
  const relative = path.relative(root, filePath);
  const allowed = /\.(?:html|css|js|png|jpe?g|webp|svg|xml|ico)$/i.test(relativePath) || ["seasonal-crepes.json", "menu-data.json"].includes(relativePath);
  if (!allowed || relative.startsWith("..") || path.isAbsolute(relative) || relative.split(/[\\/]/).some(part => part.startsWith("."))) return send(res, 404, "Not found");
  try {
    const data = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": mime[path.extname(filePath).toLowerCase()] || "application/octet-stream",
    });
    res.end(data);
  } catch {
    send(res, 404, "Not found");
  }
}

server.listen(port, "127.0.0.1", () => {
  console.log(`http://127.0.0.1:${server.address().port}`);
});
