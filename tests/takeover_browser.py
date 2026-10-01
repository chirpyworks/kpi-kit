from __future__ import annotations

import os
import socket
import subprocess
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts" / "takeover"
ARTIFACTS.mkdir(parents=True, exist_ok=True)
HOST = "127.0.0.1"
PORT = 4173


def wait_for_port(host: str, port: int, timeout: float = 20.0) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        with socket.socket() as sock:
            sock.settimeout(0.25)
            if sock.connect_ex((host, port)) == 0:
                return
        time.sleep(0.15)
    raise RuntimeError(f"Preview server did not start on {host}:{port}")


def assert_no_horizontal_overflow(page, label: str) -> None:
    overflow = page.evaluate(
        "() => ({scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth})"
    )
    if overflow["scroll"] > overflow["client"] + 1:
        raise AssertionError(
            f"{label}: horizontal overflow {overflow['scroll']} > {overflow['client']}"
        )


def capture(page, frame: str, width: int, height: int, filename: str) -> None:
    page.set_viewport_size({"width": width, "height": height})
    page.goto(
        f"http://{HOST}:{PORT}/takeover.html?frame={frame}",
        wait_until="networkidle",
    )
    page.emulate_media(reduced_motion="reduce")
    assert_no_horizontal_overflow(page, f"{frame}-{width}")
    page.screenshot(path=str(ARTIFACTS / filename), full_page=True)


def capture_confirmation(page, width: int, height: int, filename: str) -> None:
    page.set_viewport_size({"width": width, "height": height})
    page.goto(f"http://{HOST}:{PORT}/index.html", wait_until="networkidle")
    page.emulate_media(reduced_motion="reduce")
    if width <= 1100:
        page.get_by_role("button", name="Library", exact=True).click()
    page.get_by_role("button", name="Forms & feedback", exact=True).click()
    page.locator(".demo-studio-selector select").select_option("confirm")
    page.wait_for_timeout(100)
    assert_no_horizontal_overflow(page, f"job2-confirm-{width}")
    page.screenshot(path=str(ARTIFACTS / filename), full_page=True)


def main() -> None:
    env = dict(os.environ)
    server = subprocess.Popen(
        ["npm", "run", "preview", "--", "--host", HOST, "--port", str(PORT)],
        cwd=ROOT,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    try:
        wait_for_port(HOST, PORT)
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()
            capture(page, "opening", 1440, 1000, "01-opening-1440.png")
            capture(page, "core", 1440, 1000, "02-core-1440.png")
            capture(page, "proof", 1440, 1000, "03-proof-1440.png")
            capture(page, "opening", 390, 844, "04-opening-390.png")
            capture(page, "core", 390, 844, "05-core-390.png")
            capture(page, "proof", 390, 844, "06-proof-390.png")
            capture_confirmation(page, 1440, 1000, "07-job2-before-1440.png")
            capture_confirmation(page, 390, 844, "08-job2-before-390.png")
            browser.close()
        print(f"Project Takeover browser evidence written to {ARTIFACTS}")
    finally:
        server.terminate()
        try:
            server.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server.kill()
            server.wait(timeout=5)


if __name__ == "__main__":
    main()
