"""Check the actual mobile loading screen from first HTML to the first usable link."""

import re


def mobile_intro(page, base):
    # Record first paint state before Playwright can miss a short intro on a fast
    # machine. Sample actual DOM text and what's painted over the header/footer.
    page.add_init_script("""(() => {
      const trace = window.introTrace = {frames: [], released: 0};
      let last = -1;
      function sample() {
        const gate = document.querySelector('[data-mobile-intro]');
        if (!gate) {
          if (trace.frames.length && !trace.released) trace.released = performance.now();
          return;
        }
        const number = parseInt(gate.querySelector('[data-mobile-progress]').textContent, 10);
        if (last >= 0 && (number === last || (number < 100 && number > last && number - last < 5))) return;
        last = number;
        const style = getComputedStyle(gate);
        const emblem = gate.querySelector('[data-emblem]');
        const artwork = getComputedStyle(emblem).backgroundImage !== 'none' ||
          [...emblem.querySelectorAll('img')].some(img => img.naturalWidth > 0 &&
            getComputedStyle(img).visibility === 'visible');
        const locations = [[10, 12], [innerWidth / 2, 50], [innerWidth - 12, 20],
          [innerWidth / 2, innerHeight - 24], [innerWidth / 2, innerHeight / 2]];
        trace.frames.push({n: number, t: performance.now(), artwork,
          covers: locations.every(([x, y]) => gate.contains(document.elementFromPoint(x, y))),
          opacity: style.opacity, bg: style.backgroundColor});
      }
      new MutationObserver(sample).observe(document, {subtree: true, childList: true,
        characterData: true, attributes: true, attributeFilter: ['data-mobile-intro']});
    })()""")

    for condition in ("normal", "without application scripts"):
        if condition != "normal":
            page.route(re.compile(r"/_next/static/.*\.js(?:[?].*)?$"), lambda route: route.abort())
        page.goto(base + "/grid", wait_until="domcontentloaded")
        page.wait_for_function("window.introTrace.released > 0", timeout=6000)
        result = page.evaluate("window.introTrace")
        frames = result["frames"]
        values = [f["n"] for f in frames]
        assert values[0] <= 5 and values[-1] == 100 and len(set(values)) >= 5, (condition, values)
        assert values == sorted(values), f"{condition}: counter moved backwards {values}"
        assert all(f["covers"] and f["artwork"] and f["opacity"] == "1" and
                   f["bg"] in ("rgb(0, 0, 0)", "rgb(255, 255, 255)") for f in frames), (condition, frames)
        duration = result["released"] - frames[0]["t"]
        assert 1500 <= duration < 3500, f"{condition}: intro remained visible for {duration} ms"
        receives_tap = page.locator('header a[href="/info"]').evaluate("""a => {
          const r = a.getBoundingClientRect();
          return a.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
        }""")
        assert receives_tap, f"{condition}: mobile intro still intercepts navigation"
        print(f"  intro ({condition}): {values[0]} → {values[-1]}%, released after {duration:.0f} ms")
