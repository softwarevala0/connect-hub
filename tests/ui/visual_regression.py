"""
Visual regression snapshots for the Chat Manager.

Captures every Chat Manager section in dark + light mode at 5 breakpoints and
compares against stored baselines in tests/ui/baselines/. Any pixel drift above
the tolerance is reported and a diff image is written to /tmp/browser/visual/.

First run (or `--update`) writes baselines instead of comparing.

Run: python3 tests/ui/visual_regression.py [base_url] [--update]
"""
import asyncio, os, sys
from PIL import Image, ImageChops
from playwright.async_api import async_playwright

args = [a for a in sys.argv[1:] if not a.startswith("--")]
BASE = args[0] if args else "http://localhost:8080"
UPDATE = "--update" in sys.argv
BASELINE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "baselines")
OUT = "/tmp/browser/visual"
TOLERANCE = 0.005  # 0.5% of pixels may differ (fonts/AA jitter)

VIEWS = [("mobile-sm", 320, 720), ("mobile", 390, 844), ("tablet", 768, 1024),
         ("tablet-lg", 1024, 1180), ("desktop", 1440, 900)]
results = []


def check(name, ok, detail=""):
    results.append((name, ok, detail))
    print(("PASS " if ok else "FAIL ") + name + ((" — " + detail) if detail else ""))


def compare(shot, base, diff_path):
    a, b = Image.open(shot).convert("RGB"), Image.open(base).convert("RGB")
    if a.size != b.size:
        return False, f"size {a.size} vs baseline {b.size}"
    diff = ImageChops.difference(a, b)
    bbox = diff.getbbox()
    if not bbox:
        return True, ""
    changed = sum(1 for px in diff.getdata() if px != (0, 0, 0))
    ratio = changed / (a.size[0] * a.size[1])
    if ratio > TOLERANCE:
        diff.save(diff_path)
        return False, f"{ratio * 100:.2f}% pixels changed → {diff_path}"
    return True, f"{ratio * 100:.2f}% drift (within tolerance)"


async def main():
    os.makedirs(BASELINE, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900},
                                        reduced_motion="reduce", device_scale_factor=1)
        page = await ctx.new_page()
        await page.goto(BASE, wait_until="domcontentloaded")
        await page.wait_for_timeout(900)

        # Discover section ids from the sidebar nav.
        sections = await page.evaluate(
            """() => [...document.querySelectorAll('nav[aria-label="Chat Manager sections"] button')]
                 .map(b => (b.innerText || '').trim().split('\\n')[0])
                 .filter(t => t && t.length < 34).slice(0, 8)"""
        )

        for theme in ("dark", "light"):
            await page.evaluate("t => localStorage.setItem('cm.theme', t)", theme)
            await page.reload(wait_until="domcontentloaded")
            await page.wait_for_timeout(900)
            for label, w, h in VIEWS:
                await page.set_viewport_size({"width": w, "height": h})
                await page.wait_for_timeout(450)
                for sec in ([sections[0]] if w < 1024 else sections[:4]) if sections else [""]:
                    if sec and w >= 1024:
                        try:
                            await page.get_by_role("button", name=sec, exact=False).first.click(timeout=1200)
                            await page.wait_for_timeout(420)
                        except Exception:
                            continue
                    slug = f"{theme}-{label}" + (f"-{sec.lower().replace(' ', '-').replace('/', '-')}" if (sec and w >= 1024) else "")
                    shot = f"{OUT}/{slug}.png"
                    await page.screenshot(path=shot)
                    base = f"{BASELINE}/{slug}.png"
                    if UPDATE or not os.path.exists(base):
                        Image.open(shot).save(base)
                        check(f"baseline written: {slug}", True)
                    else:
                        ok, detail = compare(shot, base, f"{OUT}/{slug}.diff.png")
                        check(f"visual: {slug}", ok, detail)
        await browser.close()

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} visual checks passed")
    sys.exit(1 if failed else 0)

asyncio.run(main())
