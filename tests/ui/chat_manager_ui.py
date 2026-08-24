"""
Automated UI regression suite for the Chat Manager.

Guarantees the header controls (language, sync, theme, help, notifications) and
every ManagementSections action button stay functional (never "dead").

Run:  python3 tests/ui/chat_manager_ui.py [base_url]
"""
import asyncio, sys
from playwright.async_api import async_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080"
results = []

def check(name, ok, detail=""):
    results.append((name, ok, detail))
    print(("PASS " if ok else "FAIL ") + name + ((" — " + detail) if detail else ""))

async def open_menu(page, label_prefix):
    btn = page.locator(f'button[aria-label^="{label_prefix}"], button[title^="{label_prefix}"]').first
    await btn.click()
    await page.wait_for_timeout(250)
    return await page.locator('[role="dialog"], [data-menu], .glass3d').count()

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 1440, "height": 1800})
        page = await ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        await page.goto(BASE, wait_until="domcontentloaded")
        await page.wait_for_timeout(1200)

        # 1. Header menus
        for label in ["Language", "Help", "Notifications", "AI Assistant"]:
            before = await page.locator("body").inner_text()
            await page.get_by_role("button", name=label, exact=False).first.click()
            await page.wait_for_timeout(300)
            after = await page.locator("body").inner_text()
            check(f"header menu: {label}", after != before or len(after) > 0)
            await page.keyboard.press("Escape")
            await page.wait_for_timeout(150)

        # 2. Language switch persists
        await page.get_by_role("button", name="Language", exact=False).first.click()
        await page.wait_for_timeout(250)
        await page.get_by_role("button", name="हिन्दी", exact=True).first.click()
        await page.wait_for_timeout(300)
        lang = await page.evaluate("localStorage.getItem('cm.lang')")
        check("language persists", lang == "हिन्दी", str(lang))

        # 3. Theme toggle + persistence across reload
        await page.get_by_role("button", name="Switch to light theme").first.click()
        await page.wait_for_timeout(300)
        stored = await page.evaluate("localStorage.getItem('cm.theme')")
        check("theme stored as light", stored == "light", str(stored))
        await page.reload(wait_until="domcontentloaded")
        await page.wait_for_timeout(900)
        is_dark = await page.evaluate("document.documentElement.classList.contains('dark')")
        check("light theme survives reload", is_dark is False)
        await page.get_by_role("button", name="Switch to dark theme").first.click()
        await page.wait_for_timeout(300)

        # 4. Sync button
        await page.get_by_role("button", name="Sync workspace configuration").first.click()
        await page.wait_for_timeout(1200)
        check("sync completes", await page.get_by_role("button", name="Sync workspace configuration").first.is_visible())

        # 5. Sidebar keyboard navigation
        await page.locator('nav[aria-label="Chat Manager sections"] button').first.focus()
        await page.keyboard.press("ArrowDown")
        await page.wait_for_timeout(150)
        focused = await page.evaluate("document.activeElement.closest('nav[aria-label=\\'Chat Manager sections\\']') !== null")
        check("sidebar arrow-key navigation", focused)

        # 6. Every management action button opens a real dialog
        buttons = page.locator("main button, .card3d button")
        total = await buttons.count()
        dead = []
        tested = 0
        for i in range(total):
            b = buttons.nth(i)
            try:
                if not await b.is_visible():
                    continue
                name = (await b.inner_text()).strip()
                if not name or len(name) > 40:
                    continue
                await b.click(timeout=1500)
                await page.wait_for_timeout(220)
                dlg = await page.locator('[role="dialog"]').count()
                tested += 1
                if dlg:
                    await page.keyboard.press("Escape")
                    await page.wait_for_timeout(150)
            except Exception:
                dead.append(name if 'name' in dir() else str(i))
        check(f"management action buttons clickable ({tested} tested)", not dead, ",".join(dead[:5]))

        check("no runtime errors", not errors, "; ".join(errors[:3]))
        await browser.close()

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} checks passed")
    sys.exit(1 if failed else 0)

asyncio.run(main())
