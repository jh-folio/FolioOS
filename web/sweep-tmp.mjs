import { chromium } from "@playwright/test";

// e2e 게이트는 375px 한 폭에서, API를 404로 막은 빈 화면만 본다.
// 여기서는 실제 데이터가 실린 서버를 상대로 8.1이 요구하는 4개 폭을 잰다.
const ROUTES = ["home", "dashboard", "watchlist", "portfolio", "briefing", "rss", "market-memory", "analysis", "deep-research", "settings"];
const WIDTHS = [375, 768, 1024, 1440];
const BASE = "http://localhost:8787";

const browser = await chromium.launch();
const findings = [];

for (const theme of ["light", "dark"]) {
  for (const width of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    await page.evaluate((t) => window.localStorage.setItem("folio.theme", t), theme);
    for (const route of ROUTES) {
      await page.goto(`${BASE}/#/${route}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1200);
      const report = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const overflow = document.documentElement.scrollWidth - vw;
        const offenders = [];
        if (overflow > 1) {
          document.querySelectorAll("body *").forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.right <= vw + 1 || r.width === 0) return;
            let p = el.parentElement;
            let clipped = false;
            while (p && p !== document.body) {
              if (getComputedStyle(p).overflowX !== "visible") { clipped = true; break; }
              p = p.parentElement;
            }
            if (!clipped) offenders.push(`${el.tagName.toLowerCase()}.${(el.className || "").toString().split(" ")[0]}@${Math.round(r.right)}`);
          });
        }
        // 모바일 터치 타깃: 대화형 요소만
        const small = [];
        if (vw < 768) {
          document.querySelectorAll("button, a[href], input, select, textarea, summary").forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) return;
            if (getComputedStyle(el).display === "none") return;
            if (r.height < 44 || r.width < 44) small.push(`${el.tagName.toLowerCase()}.${(el.className || "").toString().split(" ")[0]}:${Math.round(r.width)}x${Math.round(r.height)}`);
          });
        }
        return { overflow, offenders: offenders.slice(0, 4), small: [...new Set(small)].slice(0, 6) };
      });
      if (report.overflow > 1) findings.push({ theme, width, route, kind: "overflow", detail: `${report.overflow}px ${report.offenders.join(", ")}` });
      if (report.small.length) findings.push({ theme, width, route, kind: "touch", detail: report.small.join(", ") });
    }
    await context.close();
  }
}

await browser.close();
if (!findings.length) console.log("깨끗함: 오버플로 0, 44px 미만 터치 타깃 0");
for (const f of findings) console.log(`${f.kind}\t${f.theme}\t${f.width}\t${f.route}\t${f.detail}`);
