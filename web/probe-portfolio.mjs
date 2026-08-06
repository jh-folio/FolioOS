import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 375, height: 900 } })).newPage();
await page.goto("http://localhost:8787/#/portfolio", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
console.log(JSON.stringify(await page.evaluate(() => {
  const wrap = document.querySelector(".portfolio-holdings-table-wrap");
  const sticky = [...wrap.querySelectorAll("*")].filter((el) => getComputedStyle(el).position === "sticky").length;
  const base = document.documentElement.scrollWidth;
  // 표 안의 컨트롤(입력칸)이 넓어서인지, 표 구조 자체인지 가른다
  const t = wrap.querySelector("table");
  const prevLayout = t.style.tableLayout;
  t.style.tableLayout = "fixed"; t.style.width = "100%";
  const afterFixed = document.documentElement.scrollWidth;
  t.style.tableLayout = prevLayout; t.style.width = "";
  // wrap에 contain을 주면 페이지로 새는지
  wrap.style.contain = "paint";
  const afterContain = document.documentElement.scrollWidth;
  wrap.style.contain = "";
  return { sticky, base, afterFixed, afterContain, panelOX: getComputedStyle(wrap.parentElement).overflowX };
}), null, 1));
await browser.close();
