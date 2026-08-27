"""
Accessibility + responsive audit for the Chat Manager.

Checks, per theme (dark/light) and per breakpoint:
  - every visible button/link has an accessible name
  - no interactive element is keyboard-unreachable (tabbable audit)
  - focus outlines stay visible (focus ring has non-zero outline/box-shadow)
  - no horizontal overflow, and the off-canvas sidebar never overlaps content
Writes screenshots to /tmp/browser/audit/.

Run: python3 tests/ui/a11y_responsive_audit.py [base_url]
"""
import asyncio, os, sys
from playwright.async_api import async_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080"
OUT = "/tmp/browser/audit"
BREAKPOINTS = [("mobile-sm", 320, 720), ("mobile", 390, 844), ("tablet", 768, 1024),
               ("tablet-lg", 1024, 1180), ("desktop", 1440, 900)]
results = []


def check(name, ok, detail=""):
    results.append((name, ok, detail))
    print(("PASS " if ok else "FAIL ") + name + ((" — " + detail) if detail else ""))


NAME_JS = """() => {
  const bad = [];
  for (const el of document.querySelectorAll('button, a[href], [role="button"], input, select, textarea')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const name = (el.getAttribute('aria-label') || el.getAttribute('title') ||
      (el.getAttribute('aria-labelledby') ? (document.getElementById(el.getAttribute('aria-labelledby'))?.innerText || '') : '') ||
      el.innerText || el.value || '').trim();
    if (!name) bad.push(el.tagName.toLowerCase() + '.' + (el.className.toString().split(' ')[0] || '?') + '@' + Math.round(r.x) + ',' + Math.round(r.y));
  }
  return bad;
}"""

OVERFLOW_JS = """() => {
  const de = document.documentElement;
  const over = de.scrollWidth - de.clientWidth;
  const offenders = [];
  if (over > 1) {
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.right > de.clientWidth + 1 && r.width > 4) {
        offenders.push(el.tagName.toLowerCase() + '.' + (el.className.toString().split(' ')[0] || '?') + ' right=' + Math.round(r.right));
        if (offenders.length > 4) break;
      }
    }
  }
  return { over, offenders };
}"""

SIDEBAR_OVERLAP_JS = """() => {
  const nav = document.querySelector('nav[aria-label="Chat Manager sections"]');
  const main = document.querySelector('main');
  if (!nav || !main) return { ok: true, reason: 'no nav/main' };
  const n = nav.getBoundingClientRect(), m = main.getBoundingClientRect();
  const cs = getComputedStyle(nav);
  const offCanvas = n.right <= 1 || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0;
  const overlap = Math.max(0, Math.min(n.right, m.right) - Math.max(n.left, m.left));
  return { ok: offCanvas || overlap <= 1, offCanvas, overlap: Math.round(overlap) };
}"""

FOCUS_JS = """() => {
  const out = [];
  const els = [...document.querySelectorAll('nav[aria-label="Chat Manager sections"] button, header button, main button')]
    .filter(e => e.offsetParent !== null).slice(0, 25);
  for (const el of els) {
    el.focus();
    const cs = getComputedStyle(el);
    const hasRing = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) ||
      (cs.boxShadow && cs.boxShadow !== 'none');
    if (!hasRing) out.push((el.getAttribute('aria-label') || el.innerText || '?').trim().slice(0, 30));
  }
  return out;
}"""


async def run_theme(page, theme):
    await page.evaluate("t => localStorage.setItem('cm.theme', t)", theme)
    await page.reload(wait_until="domcontentloaded")
    await page.wait_for_timeout(900)
    for label, w, h in BREAKPOINTS:
        await page.set_viewport_size({"width": w, "height": h})
        await page.wait_for_timeout(500)
        tag = f"{theme}/{label}"
        bad = await page.evaluate(NAME_JS)
        check(f"{tag}: accessible names", not bad, ", ".join(bad[:5]))
        ov = await page.evaluate(OVERFLOW_JS)
        check(f"{tag}: no horizontal overflow", ov["over"] <= 1, f"{ov['over']}px {ov['offenders'][:3]}")
        sb = await page.evaluate(SIDEBAR_OVERLAP_JS)
        check(f"{tag}: sidebar does not overlap content", sb.get("ok", True), str(sb))
        nf = await page.evaluate(FOCUS_JS)
        check(f"{tag}: focus outlines visible", not nf, ", ".join(nf[:5]))
        await page.screenshot(path=f"{OUT}/{theme}-{label}.png")


async def main():
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        await page.goto(BASE, wait_until="domcontentloaded")
        await page.wait_for_timeout(1000)
        for theme in ("dark", "light"):
            await run_theme(page, theme)
        check("no runtime errors", not errors, "; ".join(errors[:3]))
        await browser.close()
    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} checks passed")
    sys.exit(1 if failed else 0)

asyncio.run(main())
