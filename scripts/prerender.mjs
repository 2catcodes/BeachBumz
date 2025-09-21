// scripts/prerender.mjs
import http from "node:http";
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sirv from "sirv";
import puppeteer from "puppeteer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, "..", "dist");
const PORT = 4178;
const ROUTES = ["/", "/menu/", "/contact/"];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function serveDist() {
  const handler = sirv(DIST, { etag: true, single: true });
  const server = http.createServer((req, res) => handler(req, res));
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

const server = await serveDist();
const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

try {
  const page = await browser.newPage();

  for (const route of ROUTES) {
    const url = `http://localhost:${PORT}${route}`;
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });

    // Wait until SEO tags exist
    await page.waitForFunction(() => {
      const canon = document.querySelector('link[rel="canonical"]');
      const desc = document.querySelector('meta[name="description"]');
      return !!(canon && desc && desc.getAttribute("content"));
    }, { timeout: 15000 });

    await wait(250); // small settle

    const html = await page.content();
    const outDir = join(DIST, route.replace(/^\//, ""));
    const outPath = join(outDir, "index.html");
    await mkdir(outDir, { recursive: true });
    await writeFile(outPath, html, "utf8");
    console.log("Prerendered:", route, "->", outPath);
  }
} finally {
  await browser.close();
  server.close();
  console.log("Done prerendering.");
}
