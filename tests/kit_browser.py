"""Behavioral production-build checks. Requires a real Chromium runtime.

The test intentionally fails when the runtime is unavailable; it never substitutes
SSR assertions or a saved screenshot for browser verification.
"""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
import json
import os
from playwright.sync_api import sync_playwright

DIST = Path("dist").resolve()

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIST), **kwargs)
    def log_message(self, format, *args):
        pass

server = ThreadingHTTPServer(("127.0.0.1", 4173), Handler)
Thread(target=server.serve_forever, daemon=True).start()

try:
    with sync_playwright() as p:
        options = {}
        if os.environ.get("KPI_BROWSER_EXECUTABLE"):
            options["executable_path"] = os.environ["KPI_BROWSER_EXECUTABLE"]
        browser = p.chromium.launch(**options)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto("http://127.0.0.1:4173/kit.html", wait_until="networkidle")
        assert page.locator("h1").inner_text() == "Revenue overview"
        assert page.locator(".demo-kpi-ribbon .kk-metric").count() == 4
        assert "Synthetic data" in page.locator(".demo-dashboard-head").inner_text()

        # Presentation changes and observation inspection preserve the dashboard scope.
        trend = page.locator(".demo-primary-chart")
        totals_before = page.locator(".demo-kpi-ribbon .kk-metric-value").all_text_contents()
        trend.get_by_role("button", name="Line", exact=True).click()
        assert trend.locator('[data-chart="line"]').count() == 1
        assert trend.locator(".kk-area-fill").count() == 0
        trend.get_by_role("button", name="Area", exact=True).click()
        assert trend.locator('[data-chart="area"]').count() == 1
        trend.get_by_role("button", name="Compare", exact=True).click()
        assert trend.locator(".kk-comparison-line").count() == 0
        trend.get_by_role("button", name="Compare", exact=True).click()
        assert trend.locator(".kk-comparison-line").count() == 1
        trend.get_by_role("button", name="Previous observation", exact=True).click()
        assert trend.locator(".kk-series-readout").get_attribute("data-point-index") == "5"
        trend.get_by_role("button", name="Latest observation", exact=True).click()
        assert trend.locator(".kk-series-readout").get_attribute("data-point-index") == "6"
        assert page.locator(".demo-kpi-ribbon .kk-metric-value").all_text_contents() == totals_before

        # Desktop chrome fits the viewport; content scroll belongs to panels.
        for width, height in [(1440, 900), (1280, 800)]:
            page.set_viewport_size({"width": width, "height": height})
            assert page.evaluate("document.documentElement.scrollHeight <= innerHeight + 1")
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
            assert page.locator(".demo-library").is_visible()
            assert not page.locator(".demo-inspector").is_visible()
            assert page.locator(".demo-canvas").evaluate("node => getComputedStyle(node).overflowY") == "auto"

        # The same range updates values, rendered trend points, categories and rows.
        page.set_viewport_size({"width": 1440, "height": 900})
        before_values = page.locator(".demo-kpi-ribbon [data-value]").evaluate_all("nodes => nodes.map(n => n.dataset.value)")
        before_points = page.locator(".demo-analysis-grid circle.kk-dot").count()
        before_categories = page.locator(".kk-horizontal-bar").all_text_contents()
        before_rows = page.locator(".kk-table-footer [role=status]").inner_text()
        page.locator(".demo-scope-presets").get_by_role("button", name="14 days", exact=True).click()
        assert page.locator(".demo-kpi-ribbon [data-value]").evaluate_all("nodes => nodes.map(n => n.dataset.value)") != before_values
        assert page.locator(".demo-analysis-grid circle.kk-dot").count() == before_points * 2
        assert page.locator(".kk-horizontal-bar").all_text_contents() != before_categories
        assert page.locator(".kk-table-footer [role=status]").inner_text() != before_rows
        assert "2026-09-14" in page.locator(".demo-scope-bar").inner_text()
        page.locator(".demo-scope-presets").get_by_role("button", name="7 days", exact=True).click()

        # Three purposeful domains have distinct metric contracts and matching code/data.
        for nav, metric in [("Customers", "signups"), ("Operations", "completed-jobs"), ("Revenue", "net-sales")]:
            page.locator(".demo-library").get_by_role("button", name=nav, exact=False).click()
            assert page.locator(f'[data-kit-metric="{metric}"]').count() == 1
            assert page.locator(".demo-kpi-ribbon .kk-metric").count() == 4

        # Empty ranges expose recovery instead of retaining misleading values.
        page.locator(".demo-date-button").click()
        page.get_by_label("Start date", exact=True).fill("2030-01-01")
        page.get_by_label("End date", exact=True).fill("2030-01-07")
        assert page.get_by_text("No observations in this period", exact=True).is_visible()
        assert page.locator(".demo-kpi-ribbon .kk-metric").count() == 0
        page.get_by_role("button", name="Reset to sample week", exact=True).click()

        # Each chart's Code tab contains the actual selected component, with units.
        page.locator(".demo-library").get_by_role("button", name="Charts", exact=True).click()
        charts = [("Line", "SeriesChart"), ("Area", "SeriesChart"), ("Horizontal bar", "BarChart"),
                  ("Vertical bar", "VerticalBarChart"), ("Grouped bar", "GroupedBarChart"),
                  ("Stacked bar", "StackedBarChart"), ("Waterfall", "WaterfallChart"),
                  ("Donut", "DonutChart"), ("Bullet", "BulletChart")]
        for label, component in charts:
            page.locator(".demo-chart-selector").get_by_role("button", name=label, exact=True).click()
            page.get_by_role("tab", name="Code", exact=True).click()
            code = page.locator(".demo-data-code").inner_text()
            assert f"import {{ {component} }}" in code
            assert "export default function Example" in code
            if label == "Bullet":
                assert "label:'%'" in code
        page.locator(".demo-chart-selector").get_by_role("button", name="Grouped bar", exact=True).click()
        assert page.locator('[data-chart="grouped-bar"] [data-negative="true"]').count() >= 1
        page.locator(".demo-chart-selector").get_by_role("button", name="Waterfall", exact=True).click()
        zero = page.locator('[data-chart="waterfall"] [data-kind="change"][data-state="zero"] rect')
        assert zero.count() == 1 and float(zero.get_attribute("height")) == 0

        # Table actions operate on the filtered/selected records.
        page.locator(".demo-library").get_by_role("button", name="Data table", exact=True).click()
        page.get_by_placeholder("Search all columns").fill("Web store")
        assert "7 rows" in page.locator(".kk-table-footer [role=status]").inner_text()
        page.get_by_role("checkbox", name="Select rows on this page", exact=True).check()
        assert "5 selected" in page.locator(".kk-table-footer [role=status]").inner_text()
        with page.expect_download() as download:
            page.get_by_role("button", name="Export 7 filtered rows", exact=True).click()
        csv = Path(download.value.path()).read_text()
        assert "Web store" in csv and "Mobile app" not in csv

        # Every imported metric remains reachable, without changing dashboard fixtures.
        page.locator('input[type="file"]').set_input_files("public/examples/metrics.json")
        page.get_by_role("tab", name="Options", exact=True).click()
        page.get_by_label("Metric", exact=True).select_option("active-workspaces")
        assert page.locator('[data-kit-metric="active-workspaces"]').count() == 1
        page.get_by_role("tab", name="Code", exact=True).click()
        assert '"id": "active-workspaces"' in page.locator(".demo-data-code").inner_text()

        # Stateful controls, dialog Escape, theme and localized navigation.
        page.locator(".demo-library").get_by_role("button", name="Forms & feedback", exact=True).click()
        page.get_by_label("Choose example", exact=True).select_option("dialog")
        page.get_by_role("button", name="Open report details", exact=True).click()
        assert page.get_by_role("dialog").is_visible()
        page.keyboard.press("Escape")
        assert not page.get_by_role("dialog").is_visible()
        page.get_by_role("switch", name="Dark mode", exact=True).click()
        assert page.locator(".kk-demo").get_attribute("data-theme") == "light"
        page.get_by_role("switch", name="Dark mode", exact=True).click()
        assert page.locator(".kk-demo").get_attribute("data-theme") == "dark"
        page.get_by_role("button", name="한국어", exact=True).click()
        assert page.get_by_role("button", name="입력·피드백", exact=True).is_visible()
        assert page.get_by_role("button", name="상세 정보 열기", exact=True).is_visible()
        page.get_by_role("button", name="English", exact=True).click()

        # Form validation, local save, combined filtering and notification dismissal.
        page.get_by_label("Choose example", exact=True).select_option("form")
        page.get_by_role("button", name="Save sample", exact=True).click()
        assert page.get_by_label("Report name", exact=True).get_attribute("aria-invalid") == "true"
        assert page.locator(".kk-control-error-summary").is_visible()
        page.get_by_role("button", name="Fill sample values", exact=True).click()
        page.get_by_role("button", name="Save sample", exact=True).click()
        assert page.get_by_text("Sample saved", exact=True).is_visible()
        assert "Nothing is saved to a real server" in page.locator(".kk-notification").inner_text()
        page.get_by_label("Choose example", exact=True).select_option("filters")
        page.get_by_label("Search reports", exact=True).fill("no-such-report")
        assert page.locator(".kk-control-result-list li").count() == 0
        assert "No reports match" in page.locator(".kk-control-empty").inner_text()
        page.get_by_role("button", name="Reset filters", exact=True).click()
        assert page.locator(".kk-control-result-list li").count() == 4
        page.get_by_label("Choose example", exact=True).select_option("confirm")
        assert page.locator(".kk-control-result-list li").count() == 1
        page.get_by_role("button", name="Review reset", exact=True).click()
        page.get_by_role("dialog").locator(".kk-control-actions").get_by_role("button", name="Cancel", exact=True).click()
        assert page.locator(".kk-control-result-list li").count() == 1
        page.get_by_role("button", name="Review reset", exact=True).click()
        page.get_by_role("dialog").get_by_role("button", name="Reset filters", exact=True).click()
        assert page.locator(".kk-control-result-list li").count() == 4
        page.get_by_label("Choose example", exact=True).select_option("notification")
        page.get_by_role("button", name="Dismiss notification", exact=True).click()
        assert page.locator(".kk-notification").count() == 0
        page.get_by_role("button", name="Show notification again", exact=True).click()
        assert page.locator(".kk-notification").count() == 1

        # State recovery remains an explicit simulation and preserves denial semantics.
        page.locator(".demo-library").get_by_role("button", name="Data states", exact=True).click()
        assert page.locator(".kk-state-studio").get_attribute("data-demo-phase") == "error"
        page.get_by_role("button", name="Simulate retry", exact=True).click()
        assert page.locator(".kk-state-studio").get_attribute("data-demo-phase") == "loading"
        page.get_by_role("button", name="Complete simulated request", exact=True).click()
        assert page.locator(".kk-state-studio").get_attribute("data-demo-phase") == "ready"
        page.get_by_role("button", name="Reset example", exact=True).click()
        page.get_by_label("Simulated result", exact=True).select_option("failure")
        page.get_by_role("button", name="Simulate retry", exact=True).click()
        page.get_by_role("button", name="Complete simulated request", exact=True).click()
        assert page.locator(".kk-state-studio").get_attribute("data-demo-phase") == "error"
        page.get_by_label("Choose example", exact=True).select_option("no-results")
        assert page.locator(".kk-state-evidence").count() == 0
        page.get_by_role("button", name="Clear filters", exact=True).click()
        assert page.locator(".kk-state-evidence [data-region]").count() == 3
        page.get_by_label("Search sample regions", exact=True).fill("East")
        assert page.locator(".kk-state-evidence [data-region]").count() == 1
        page.get_by_label("Choose example", exact=True).select_option("partial")
        assert page.locator('[data-missing="true"]').count() == 1
        assert "complete total withheld" in page.locator(".kk-state-evidence").inner_text()
        page.locator(".demo-library").get_by_role("button", name="Error pages", exact=True).click()
        assert page.locator('.kk-error-page[data-state="500"]').is_visible()
        page.get_by_label("Choose example", exact=True).select_option("403")
        assert page.get_by_role("button", name="Simulate retry", exact=True).count() == 0
        page.get_by_role("button", name="Simulate going back", exact=True).click()
        assert "remains inaccessible" in page.locator(".kk-state-demo-result").inner_text()
        page.get_by_role("button", name="Show error page again", exact=True).click()
        assert page.locator('.kk-error-page[data-state="403"]').is_visible()
        page.get_by_label("Choose example", exact=True).select_option("404")
        assert page.locator('.kk-error-page[data-state="404"]').is_visible()
        page.get_by_label("Choose example", exact=True).select_option("maintenance")
        assert "Not confirmed" in page.locator(".kk-feedback-meta").inner_text()

        # Reusable shell navigation, tabs, details and bounded pagination.
        page.locator(".demo-library").get_by_role("button", name="Navigation & layout", exact=True).click()
        page.locator(".kk-side-navigation").get_by_role("button", name="Reports", exact=False).click()
        assert page.locator('.kk-side-navigation [aria-current="page"]').inner_text().startswith("Reports")
        page.get_by_label("Choose example", exact=True).select_option("tabs")
        page.locator(".kk-navigation-example").get_by_role("tab", name="Source", exact=True).click()
        assert page.get_by_role("tabpanel", name="Source", exact=True).is_visible()
        page.get_by_label("Choose example", exact=True).select_option("detail")
        page.get_by_role("button", name="Close detail panel", exact=True).click()
        assert page.locator(".kk-detail-panel").count() == 0
        page.get_by_role("button", name="Channel performance", exact=False).click()
        assert page.locator(".kk-detail-panel").is_visible()
        page.get_by_label("Choose example", exact=True).select_option("pagination")
        assert not page.get_by_role("button", name="Previous page", exact=True).is_enabled()
        page.get_by_role("button", name="Next page", exact=True).click()
        assert "Weekly report 06" in page.locator(".kk-navigation-pages-list").inner_text()

        # Mobile exposes one panel at a time, readable controls and natural scrolling.
        for width in [360, 390, 768, 980, 1100]:
            page.set_viewport_size({"width": width, "height": 844})
            page.get_by_role("tab", name="Library", exact=True).click()
            page.locator(".demo-library").get_by_role("button", name="Revenue", exact=False).click()
            assert page.locator(".demo-preview").is_visible()
            assert not page.locator(".demo-library").is_visible()
            assert not page.locator(".demo-inspector").is_visible()
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
            page.get_by_role("tab", name="Inspector", exact=True).click()
            page.get_by_role("tab", name="Options", exact=True).click()
            assert page.get_by_label("Start date", exact=True).is_visible()

        # Bad imports from the mobile Library surface a visible error and preserve data.
        page.get_by_role("tab", name="Library", exact=True).click()
        page.locator('input[type="file"]').set_input_files({"name":"invalid.json","mimeType":"application/json","buffer":b"{}"})
        assert page.locator(".demo-error").is_visible()
        assert page.locator(".demo-preview").is_visible()
        assert not errors, errors

        # A real mobile browser context is essential: desktop set_viewport_size
        # alone cannot detect a lost viewport meta tag / default 980px layout.
        for width in [360, 390]:
            mobile_context = browser.new_context(viewport={"width": width, "height": 844}, device_scale_factor=3, is_mobile=True, has_touch=True)
            mobile = mobile_context.new_page()
            mobile.goto("http://127.0.0.1:4173/kit.html", wait_until="networkidle")
            assert mobile.evaluate("innerWidth") == width
            assert mobile.locator('meta[name="viewport"]').count() == 1
            assert mobile.locator(".demo-mobile-tabs").is_visible()
            assert mobile.locator(".demo-preview").is_visible()
            assert not mobile.locator(".demo-inspector").is_visible()
            mobile.get_by_role("tab", name="Library", exact=True).click()
            mobile.locator(".demo-library").get_by_role("button", name="KPI patterns", exact=True).click()
            assert not mobile.locator(".demo-inspector").is_visible()
            assert mobile.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
            assert mobile.locator(".demo-metric-specimen .kk-metric-value").evaluate("node => parseFloat(getComputedStyle(node).fontSize)") >= 28
            mobile.get_by_role("tab", name="Inspector", exact=True).click()
            assert mobile.locator(".demo-inspector").is_visible()
            assert not mobile.locator(".demo-preview").is_visible()
            mobile.get_by_role("tab", name="Code", exact=True).click()
            assert mobile.get_by_role("button", name="Copy code", exact=True).is_visible()
            mobile.get_by_role("button", name="Close inspector", exact=True).click()
            assert mobile.locator(".demo-preview").is_visible()
            assert not mobile.locator(".demo-inspector").is_visible()
            mobile.get_by_role("tab", name="Library", exact=True).click()
            assert mobile.locator(".demo-library").is_visible()
            assert not mobile.locator(".demo-preview").is_visible()
            mobile_context.close()
        browser.close()
        print("Browser behavior checks passed: desktop, filters, templates, chart code, signed geometry, table CSV, import, states, locales, theme, mobile")
finally:
    server.shutdown()
    server.server_close()
