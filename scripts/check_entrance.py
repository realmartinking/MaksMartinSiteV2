"""Keep incoming mobile titles painted during a fling, with normal motion on."""

from playwright.sync_api import expect


def fast_entrance(page, base):
    page.emulate_media(reduced_motion="no-preference")
    sample = """() => {
      const edge = document.querySelector('header').getBoundingClientRect().bottom;
      return [...document.querySelectorAll('main [data-feed-index]')].map(row => {
        const box = row.getBoundingClientRect();
        const animated = row.querySelector('[data-entrance]');
        const style = animated && getComputedStyle(animated);
        return {i: +row.dataset.feedIndex, top: box.top, bottom: box.bottom,
          phase: animated?.dataset.entrance, opacity: +(style?.opacity || 0),
          animation: style?.animationName, delay: parseFloat(style?.animationDelay || 0)};
      }).filter(row => row.top < innerHeight - 8 && row.bottom > edge + 8);
    }"""

    for path in ("/list", "/production/list"):
        page.goto(base + path, wait_until="domcontentloaded")
        expect(page.locator("[data-mobile-intro]")).not_to_be_visible(timeout=4500)
        page.wait_for_selector('main [data-entrance="visible"]', state="attached")
        initial = page.evaluate(sample)
        assert any(r["phase"] == "visible" and r["animation"] != "none" for r in initial), \
            f"{path}: the original entrance was lost"
        assert max(r["delay"] for r in initial) >= 0.16, f"{path}: no initial stagger"

        initial_ids = {row["i"] for row in initial}
        for _ in range(5):
            page.evaluate("window.scrollBy({top:36,behavior:'instant'})")
            page.wait_for_timeout(115)
        slow = [r for r in page.evaluate(sample) if r["i"] not in initial_ids]
        assert any(r["phase"] == "visible" and r["animation"] != "none" and r["delay"] <= .25 for r in slow), \
            f"{path}: gentle scrolling no longer reveals new rows with the motion design"

        largest = 0
        for step in range(24):
            page.evaluate("window.scrollBy({top:410,behavior:'instant'})")
            page.wait_for_timeout(85)
            rows = page.evaluate(sample)
            largest = max(largest, max((r["i"] for r in rows), default=0))
            assert rows and sum(r["opacity"] > .2 for r in rows) >= len(rows) // 2, \
                f"{path}: empty screen at step {step}, visible rows {rows}"
        assert largest > 100, f"{path}: did not cross enough virtual window boundaries"
        page.wait_for_timeout(300)
        rows = page.evaluate(sample)
        assert rows and all(r["opacity"] > .9 for r in rows), f"{path}: titles stayed hidden after the fling"
