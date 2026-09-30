from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright

DIST = Path("dist").resolve()

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIST), **kwargs)
    def log_message(self, format, *args):
        pass

server = ThreadingHTTPServer(("127.0.0.1", 4173), Handler)
thread = Thread(target=server.serve_forever, daemon=True)
thread.start()

try:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        page.goto("http://127.0.0.1:4173/kit.html", wait_until="networkidle")
        assert "Compose dashboards faster" in page.locator("h1").inner_text()
        assert page.locator(".demo-kpi-ribbon .kk-metric").count() == 4

        page.get_by_role("button", name="KPI patterns").click()
        page.get_by_role("button", name="target").click()
        assert page.locator(".demo-specimen .kk-metric--target").count() == 1

        page.get_by_role("button", name="Charts").click()
        page.get_by_role("button", name="Waterfall").click()
        assert page.locator('[data-chart="waterfall"]').count() == 1

        page.get_by_role("button", name="Table").click()
        assert page.get_by_role("table").count() >= 1
        page.get_by_role("checkbox", name="Select row r1").check()
        assert "1 selected" in page.get_by_role("status").inner_text()

        page.set_viewport_size({"width": 390, "height": 844})
        page.get_by_role("button", name="Overview").click()
        assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1")

        page.get_by_role("button", name="한국어").click()
        assert "대시보드의 숫자를" in page.locator("h1").inner_text()

        browser.close()
finally:
    server.shutdown()
    server.server_close()
