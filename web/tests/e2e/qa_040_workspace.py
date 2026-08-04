"""Read-only browser QA for the Folio OS 0.4 workspace surfaces."""
from __future__ import annotations

import json
import os
import time
from pathlib import Path

from playwright.sync_api import sync_playwright


BASE_URL = "http://127.0.0.1:8787"
RESULTS = Path(__file__).resolve().parents[2] / "test-results" / "qa-040"


def assert_no_horizontal_overflow(page) -> None:
    metrics = page.evaluate(
        """() => ({
          viewport: window.innerWidth,
          document: document.documentElement.scrollWidth,
          body: document.body.scrollWidth,
        })"""
    )
    assert metrics["document"] <= metrics["viewport"] + 1, metrics
    assert metrics["body"] <= metrics["viewport"] + 1, metrics


def main() -> None:
    RESULTS.mkdir(parents=True, exist_ok=True)
    console_errors: list[str] = []
    page_errors: list[str] = []
    requests: list[str] = []
    http_errors: list[str] = []

    with sync_playwright() as playwright:
        executable_path = os.environ.get("FOLIO_QA_CHROMIUM") or None
        browser = playwright.chromium.launch(headless=True, executable_path=executable_path)
        context = browser.new_context(viewport={"width": 1440, "height": 1000})
        page = context.new_page()
        page.on("console", lambda message: console_errors.append(f"{message.text} {message.location}") if message.type == "error" else None)
        page.on("pageerror", lambda error: page_errors.append(str(error)))
        page.on("request", lambda request: requests.append(request.url))
        page.on("response", lambda response: http_errors.append(f"{response.status} {response.url}") if response.status >= 400 else None)

        page.goto(f"{BASE_URL}/#/dashboard", wait_until="networkidle")
        page.locator(".research-cockpit").wait_for()
        assert page.locator("h1", has_text="대시보드").count() == 1
        for heading in ("무엇이 달라졌나", "집중 차트", "다가오는 일정", "내 포지션과의 연결"):
            assert page.get_by_role("heading", name=heading).count() == 1, heading
        assert not any("/api/market-widgets/settings" in url for url in requests)
        cockpit_timings = []
        cockpit = None
        for _ in range(10):
            started = time.perf_counter()
            cockpit = page.request.get(f"{BASE_URL}/api/dashboard/cockpit")
            cockpit_timings.append((time.perf_counter() - started) * 1000)
            assert cockpit.ok
        assert cockpit is not None
        assert cockpit.ok
        cockpit_bytes = len(cockpit.body())
        cockpit_payload = cockpit.json()
        assert cockpit_bytes <= 150_000, cockpit_bytes
        assert cockpit_payload["telemetry"]["upstreamRequests"] == 0
        cockpit_p95_ms = sorted(cockpit_timings)[int(len(cockpit_timings) * 0.95) - 1]
        assert cockpit_p95_ms <= 500, cockpit_p95_ms
        page.screenshot(path=str(RESULTS / "dashboard-desktop.png"), full_page=True)
        assert_no_horizontal_overflow(page)

        # Exercise the preserved rollback route without persisting a server setting.
        page.evaluate("localStorage.setItem('folio.dashboardMode', 'legacy')")
        page.reload(wait_until="networkidle")
        page.locator("#marketWidgetBoard").wait_for()
        assert page.get_by_role("button", name="Cockpit").get_attribute("aria-pressed") == "false"
        assert any("LegacyMarketWidgetBoard" in url for url in requests)
        assert any("/api/market-widgets/settings" in url for url in requests)
        page.evaluate("localStorage.setItem('folio.dashboardMode', 'cockpit')")

        page.goto(f"{BASE_URL}/#/portfolio", wait_until="networkidle")
        page.locator(".portfolio-route").wait_for()
        assert page.get_by_role("button", name="Portfolio 저장").count() == 1
        assert page.get_by_text("상담 내용은 Canonical 보고서 근거로 사용되지 않습니다.").count() == 1
        page.get_by_role("button", name="사진에서 가져오기").click()
        dialog = page.get_by_role("dialog", name="증권사 화면에서 가져오기")
        dialog.wait_for()
        assert dialog.get_by_text("원본과 OCR 원문은 저장하지 않습니다.").count() == 1
        assert dialog.locator('input[type="file"]').get_attribute("accept") == "image/png,image/jpeg,image/webp"
        dialog.get_by_role("button", name="닫기").click()
        assert dialog.count() == 0
        assert_no_horizontal_overflow(page)

        # Keyboard skip link and dark mode remain functional on the new surfaces.
        page.goto(f"{BASE_URL}/#/dashboard", wait_until="networkidle")
        # Route navigation intentionally focuses the route host; directly focus the
        # skip link to verify its keyboard activation contract from that state.
        page.locator("a.react-skip-link").focus()
        assert page.evaluate("document.activeElement?.classList.contains('react-skip-link')") is True
        page.keyboard.press("Enter")
        page.wait_for_timeout(100)
        assert page.evaluate("document.activeElement?.classList.contains('react-route-host')") is True
        assert page.url.endswith("/#/dashboard"), page.url
        page.evaluate("window.FolioTheme.setPreference('dark')")
        assert page.locator("html").get_attribute("data-theme") == "dark"

        page.evaluate("localStorage.setItem('folio.react.agentClosed', '1')")
        page.set_viewport_size({"width": 360, "height": 800})
        page.reload(wait_until="networkidle")
        page.locator(".research-cockpit").wait_for()
        assert_no_horizontal_overflow(page)
        chart_height = page.locator(".cockpit-chart-stage").bounding_box()["height"]
        assert 329 <= chart_height <= 331, chart_height
        page.screenshot(path=str(RESULTS / "dashboard-mobile-dark.png"), full_page=True)

        browser.close()

    ignored = ("favicon.ico", "ERR_BLOCKED_BY_CLIENT")
    actionable_console = [row for row in console_errors if not any(token in row for token in ignored)]
    actionable_http = [row for row in http_errors if not any(token in row for token in ignored)]
    assert page_errors == [], page_errors
    assert actionable_http == [], actionable_http
    assert actionable_console == [], {"console": actionable_console, "http": actionable_http}
    print(json.dumps({
        "dashboardPayloadBytes": cockpit_bytes,
        "dashboardP95Ms": round(cockpit_p95_ms, 2),
        "consoleErrors": len(actionable_console),
        "pageErrors": len(page_errors),
        "httpErrors": len(actionable_http),
        "screenshots": [str(RESULTS / "dashboard-desktop.png"), str(RESULTS / "dashboard-mobile-dark.png")],
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
