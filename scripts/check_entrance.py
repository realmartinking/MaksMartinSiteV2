"""Keep incoming mobile titles painted during a fling, with normal motion on."""

from playwright.sync_api import expect


def check_swipe_titles(page, path):
    # A typical touch flick used to cancel the animation outright. Sample
    # the rendered text during the swipe, including rows added by the feed.
    result = page.evaluate("""async () => {
      const frame = () => new Promise(resolve => requestAnimationFrame(resolve));
      const selector = 'main [data-feed-index]';
      const startedBelow = +[...document.querySelectorAll(selector)]
        .find(row => row.getBoundingClientRect().top >= innerHeight).dataset.feedIndex;
      const moved = new Set();
      for (let tick = 0; tick < 30; tick++) {
        if (tick < 10) scrollBy({top: tick === 0 ? innerHeight / 2 : 44, behavior: 'instant'});
        await frame();
        for (const row of document.querySelectorAll(selector)) {
          const id = +row.dataset.feedIndex;
          if (id < startedBelow || moved.has(id) || row.getBoundingClientRect().top >= innerHeight) continue;
          const style = getComputedStyle(row.querySelector('.project-entrance'));
          if (style.animationName === 'list-entrance' && style.animationDuration === '1s' &&
              +style.opacity > 0 && +style.opacity < .999 && parseFloat(style.filter.slice(5)) > 0 &&
              style.transform !== 'none' && new DOMMatrixReadOnly(style.transform).m42 > 0) moved.add(id);
        }
      }
      const latest = Math.max(...[...document.querySelectorAll(selector)]
        .filter(row => row.getBoundingClientRect().top < innerHeight - 8).map(row => +row.dataset.feedIndex));
      return {first: startedBelow, last: latest, moved: [...moved]};
    }""")
    expected = set(range(result["first"], result["last"] + 1))
    assert len(expected) >= 5 and expected.issubset(result["moved"]), \
        f"{path}: titles skipped their original rise, blur and fade on a swipe: {result}"


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

        check_swipe_titles(page, path)
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
        assert rows and all(r["phase"] == "visible" and r["delay"] <= 0 and r["opacity"] > .2 for r in rows), \
            f"{path}: titles were hidden or queued after the fling: {rows}"
        # At 300ms the original one-second easing only reaches ~88% opacity.
        # Give the last incoming title its full entrance before judging its end.
        page.wait_for_timeout(700)
        rows = page.evaluate(sample)
        assert rows and all(r["opacity"] > .99 for r in rows), f"{path}: titles never finished appearing: {rows}"
