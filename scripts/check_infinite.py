"""Check touch feed continuity, mounted card counts, and return to the first item.

    python scripts/check_infinite.py http://127.0.0.1:3000

Runs against the production build with Python Playwright. The assertions measure
which project is actually on screen, without relying on a logical loop counter.
"""
import argparse
import json
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

from touch_input import swipe


ROUTES = ("/grid", "/grid?motion=classic", "/gallery", "/list", "/production/gallery", "/production/list")
SELECTORS = {"grid": "main [data-hover-card]", "gallery": "main .group.aspect-square",
             "list": "main button[data-project-id]"}


# Labels come from the controls and media that the visitor actually sees. Use the
# occurrence number to distinguish identical projects several cycles apart.
MEASURE = """selector => {
    const cards = [...document.querySelectorAll(selector)].map(el => {
        const box = el.getBoundingClientRect();
        const name = el.querySelector('video[aria-label]')?.getAttribute('aria-label')
            || el.querySelector('img[alt]:not([alt=""])')?.alt
            || el.textContent.split('. ')[0].trim();
        const mark = el.closest('[data-feed-index]') || el.querySelector('[data-feed-index]');
        return {name, index:mark ? Number(mark.dataset.feedIndex) : null, x:Math.round(box.x), y:box.y, h:box.height};
    }).filter(c => c.h > 0);
    const top = document.querySelector('header').getBoundingClientRect().bottom;
    const visible = cards.filter(c => c.y < innerHeight-4 && c.y+c.h > top+4);
    return {cards, visible, top, mounted:document.querySelectorAll(selector).length,
            nodes:document.querySelectorAll('main *').length,
            sources:document.querySelectorAll('main video[src]').length, scroll:scrollY};
}"""


def settle(page):
    page.evaluate("""() => new Promise(r => requestAnimationFrame(() =>
        requestAnimationFrame(() => requestAnimationFrame(r))))""")


def scroll_to(page, y):
    page.evaluate("y => window.scrollTo({top:y,behavior:'instant'})", y)
    settle(page)


def centre(page, state, card):
    viewport = page.viewport_size["height"]
    y = state["scroll"] + card["y"] + card["h"]/2 - (state["top"]+viewport)/2
    scroll_to(page, max(0, y))


def play_after_loop(page, selector):
    # Real touch on a Play button: a locator.tap() could scroll a different
    # copy into view to make the action possible and mask a broken window.
    for _ in range(6):
        target = page.evaluate("""() => {
            const header = document.querySelector('header').getBoundingClientRect().bottom;
            for (const el of document.querySelectorAll('main button[aria-label^="Play "]')) {
                const b = el.getBoundingClientRect(), x=b.x+b.width/2,y=b.y+b.height/2;
                if(y>header+3 && y<innerHeight-3 && el.contains(document.elementFromPoint(x,y)))
                    return {x,y,name:el.getAttribute('aria-label').slice(5)};
            }
        }""")
        if target:
            page.touchscreen.tap(target["x"], target["y"])
            page.wait_for_function("""name => [...document.querySelectorAll('main video')].some(v =>
                v.getAttribute('aria-label')===name && !v.paused && v.currentTime>.12 &&
                v.parentElement.dataset.frameReady==='true')""", arg=target["name"])
            return target["name"]
        scroll_to(page, page.evaluate("scrollY")+180)
        page.wait_for_timeout(90)
    raise AssertionError(f"No tappable project after looping on {page.url}")


def list_after_loop(page, selector, state, title):
    card = min((c for c in state["cards"] if c["name"] == title), key=lambda c:abs(c["y"]-350))
    centre(page, state, card)
    row = page.locator(f'[data-feed-index="{card["index"]}"]')
    button = row.get_by_role("button", name=title, exact=True)
    if not button.count():  # The occurrence marker may live on the button itself.
        button = row
    button.tap()
    expect(button).to_have_attribute("aria-expanded", "true")
    video = page.locator(f'main video[aria-label="{title}"][src]')
    page.wait_for_function("""name => [...document.querySelectorAll('main video[src]')].some(v =>
        v.ariaLabel === name && !v.paused && v.currentTime > .1)""", arg=title)
    expanded_at = page.evaluate("scrollY")
    # Just beyond the viewport: an expanded row may still live in overscan.
    # Its decoder should be released even before the row itself is evicted.
    scroll_to(page, expanded_at+round(page.viewport_size["height"]*1.3))
    expect(video).to_have_count(0)
    scroll_to(page, expanded_at)
    expect(button).to_have_attribute("aria-expanded", "true")
    page.wait_for_function("""name => [...document.querySelectorAll('main video[src]')].some(v =>
        v.ariaLabel===name && !v.paused && v.currentTime>.1)""", arg=title)
    button.tap()
    expect(button).to_have_attribute("aria-expanded", "false")
    page.wait_for_function("b => b.nextElementSibling.getBoundingClientRect().height < 1", arg=button.element_handle())
    settle(page)
    return title


def bounded_feed(page, base, path, session):
    mode = path.split("?")[0].rsplit("/", 1)[-1]
    selector = SELECTORS[mode]
    size = 8 if path.startswith("/production/") else 18
    page.goto(base + path, wait_until="domcontentloaded")
    expect(page.get_by_role("switch")).to_be_visible()
    page.wait_for_selector("[data-mobile-feed] [data-feed-index]", state="attached")
    settle(page)
    original = page.evaluate(MEASURE, selector)
    if mode == "list":
        # Lists previously hit React's nested-update limit on the very first
        # absolute jump, even though smaller scroll steps all worked.
        scroll_to(page, page.evaluate("document.documentElement.scrollHeight"))
        cold_bottom = page.evaluate(MEASURE, selector)
        assert cold_bottom["visible"] and cold_bottom["scroll"] > 0, f"{path}: crashed on first bottom jump"
        scroll_to(page, 0)
        original = page.evaluate(MEASURE, selector)
    cards = original["cards"]
    assert original["scroll"] == 0 and original["visible"][0]["index"] == 0, f"{path}: wrong cold landing"
    assert cards[0]["index"] == 0 and len(cards) >= size, f"{path}: incomplete starting collection"
    names = [c["name"] for c in cards[:size]]
    assert len(set(names)) == size and all(names), f"{path}: missing project names"
    peak_cards = original["mounted"]
    peak_nodes = original["nodes"]
    history = []
    state = original
    visited = 0
    for step in range(14):
        # Approach the end of the currently mounted chunk, as a real scroller
        # would. A frozen append sentinel stalls; an unbounded append-only
        # implementation eventually exceeds the card budget.
        last = state["cards"][-1]
        centre(page, state, last)
        state = page.evaluate(MEASURE, selector)
        mounted_ids = [c["index"] for c in state["cards"]]
        assert mounted_ids and mounted_ids == list(range(mounted_ids[0], mounted_ids[-1]+1)), (
            f"{path}: missing or duplicate occurrence at a chunk boundary")
        visible = state["visible"]
        assert visible and all(c["name"] == names[c["index"] % size] for c in visible), f"{path}: wrong or blank window"
        latest = visible[-1]["index"]
        assert latest > visited, f"{path}: stopped at occurrence {visited}"
        visited = latest
        peak_cards = max(peak_cards, state["mounted"])
        peak_nodes = max(peak_nodes, state["nodes"])
        assert peak_cards <= 144, f"{path}: {peak_cards} mounted cards"
        assert state["sources"] <= 2, f"{path}: too many attached project videos"
        anchor = min(visible, key=lambda c: abs(c["y"]-state["top"]-50))
        history.append((state["scroll"], anchor))
        if latest >= size*10:
            break
    assert visited >= size*10, f"{path}: only reached project {visited} after scrolling"
    assert state["cards"][0]["index"] >= size, f"{path}: distant first catalogue was never released"
    assert peak_nodes <= original["nodes"]*3 + 80, f"{path}: DOM grew from {original['nodes']} to {peak_nodes}"
    if session is not None:
        start = state["scroll"]
        swipe(page, session, 105, 355, 575)
        page.wait_for_function("start => scrollY < start-65", arg=start)
        page.wait_for_timeout(300)
        state = page.evaluate(MEASURE, selector)
        assert state["visible"], f"{path}: empty viewport after native return swipe"
    if mode == "list":
        action = list_after_loop(page, selector, state, "Fashion TV" if size==8 else "High Bay")
    else:
        action = play_after_loop(page, selector)

    # Revisit known positions from the other direction. The same logical item
    # must return under the same finger position, rather than jumping a row.
    for y, anchor in reversed(history[::2]):
        scroll_to(page, y)
        back = page.evaluate(MEASURE, selector)
        found = next((c for c in back["visible"] if c["index"]==anchor["index"]), None)
        assert found and found["name"] == anchor["name"] and abs(found["y"]-anchor["y"]) <= 5, (
            f"{path}: returning to {y} misplaced #{anchor['index']}: {found}, expected y {anchor['y']:.1f}")
    for _ in range(3):
        # Also exercise absolute jumps: the browser may go directly from the
        # beginning to the *physical* bottom, far past the mounted children.
        scroll_to(page, page.evaluate("document.documentElement.scrollHeight"))
        at_end = page.evaluate(MEASURE, selector)
        assert at_end["visible"] and at_end["visible"][0]["index"] > size, f"{path}: blank/crashed at bottom"
        scroll_to(page, 0)
        back = page.evaluate(MEASURE, selector)
        assert back["scroll"] == 0 and back["visible"] and back["visible"][0]["index"] == 0, (
            f"{path}: first item did not recover after a jump to the physical bottom")
    return {"catalogue":size, "last_occurrence":visited, "peak_cards":peak_cards,
            "peak_dom_nodes":peak_nodes, "restored_positions":len(history[::2]), "action":action}


def desktop_guard(browser, base):
    page = browser.new_page(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
    page.set_default_timeout(7000)
    try:
        for path in ("/grid", "/gallery", "/list", "/production/gallery", "/production/list"):
            page.goto(base + path, wait_until="domcontentloaded")
            expect(page.get_by_role("switch")).to_be_visible()
            selector = SELECTORS[path.rsplit("/", 1)[-1]]
            start = page.locator(selector).first.bounding_box()
            page.mouse.move(450, 650)
            page.mouse.wheel(0, 280)
            page.wait_for_function("y => scrollY > y+30", arg=0)
            end = page.locator(selector).first.bounding_box()
            assert end["y"] < start["y"] - 20, f"{path}: desktop wheel did not move the catalogue"
        button = page.locator("main button[data-project-id]").first
        button.hover()
        page.wait_for_function("""() => {
            const v=document.querySelector('main .opacity-100 video');
            return v && !v.paused && v.currentTime>.1;
        }""")
        # Eight projects fill less than two rows on some desktops. The newly
        # appended sentinel can still be inside its observer margin. Visit the
        # physical bottom repeatedly to prove that each append re-arms it.
        page.goto(base + "/production/gallery", wait_until="domcontentloaded")
        expect(page.get_by_role("switch")).to_be_visible()
        gallery = SELECTORS["gallery"]
        initial = page.locator(gallery).count()
        previous_y = -1
        for _ in range(5):
            old_count = page.locator(gallery).count()
            page.evaluate("scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'})")
            page.wait_for_function("([sel,n]) => document.querySelectorAll(sel).length > n",
                                   arg=[gallery, old_count], timeout=4000)
            settle(page)
            y = page.evaluate("scrollY")
            assert y > previous_y, "Short desktop Production Gallery stopped advancing"
            previous_y = y
        assert page.locator(gallery).count() >= initial + 5*8
    finally:
        page.close()


def main():
    arg = argparse.ArgumentParser(description=__doc__)
    arg.add_argument("url")
    arg.add_argument("--chromium-path")
    arg.add_argument("--engine", choices=["webkit", "chromium", "both"], default="both")
    arg.add_argument("--output", type=Path)
    args = arg.parse_args()
    results = {}
    with sync_playwright() as pw:
        for engine in ("webkit", "chromium") if args.engine == "both" else (args.engine,):
            options = {"executable_path": args.chromium_path} if args.chromium_path and engine == "chromium" else {}
            browser = getattr(pw, engine).launch(**options)
            profile = dict(pw.devices["iPhone 14 Pro Max"])
            profile.pop("default_browser_type", None)
            try:
                page = browser.new_page(**profile, reduced_motion="reduce")
                page.set_default_timeout(7500)
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                # Under an autoplay block the grid/gallery must expose a real
                # Play control, including on a copy reached after many loops.
                page.add_init_script("""(() => {
                    const play = HTMLMediaElement.prototype.play;
                    const unlocked = new WeakSet();
                    document.addEventListener('click', e => {
                        if(!e.isTrusted) return;
                        const v=e.target.closest('[data-frame-ready]')?.querySelector('video');
                        if(v) unlocked.add(v);
                    },true);
                    HTMLMediaElement.prototype.play=function(){
                        return (location.pathname.endsWith('/list') || unlocked.has(this)) ? play.call(this) :
                            Promise.reject(new DOMException('Autoplay blocked', 'NotAllowedError'));
                    };
                })()""")
                session = page.context.new_cdp_session(page) if engine == "chromium" else None
                for path in ROUTES:
                    result = bounded_feed(page, args.url.rstrip("/"), path, session)
                    assert not errors, f"{engine} {path}: unhandled page errors: {errors}"
                    results[engine + path] = result
                    print(f"PASS {engine} {path}: {result['peak_cards']} cards, {result['action']}", flush=True)
                if engine == "chromium":
                    desktop_guard(browser, args.url.rstrip("/"))
                    print("PASS desktop wheel, hover and continued short-gallery repetition", flush=True)
            finally:
                browser.close()
                if args.output:
                    args.output.write_text(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
