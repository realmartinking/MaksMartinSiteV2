"""Run against a running production build or preview, with Python Playwright installed.

    python -m playwright install webkit chromium
    python scripts/check-mobile.py http://127.0.0.1:3000

WebKit and Chromium both exercise touchscreen taps and rotation. Chromium also
exposes trusted swipe input through CDP. Use --chromium-path for a local Chrome.
"""
import argparse
import re
from urllib.parse import urlparse

from playwright.sync_api import expect, sync_playwright


PORTRAIT = {"width": 430, "height": 740}
LANDSCAPE = {"width": 932, "height": 430}


def nav(page, name, url):
    # Use the same visible control a visitor would tap, including after swiping.
    page.get_by_role("navigation").get_by_role("link", name=name, exact=True).tap()
    page.wait_for_url(lambda target: urlparse(target).path == url)


def swipe(page, session, x, start, end):
    def send(event, y=None):
        points = [] if y is None else [{"x": x, "y": y}]
        session.send("Input.dispatchTouchEvent", {"type": event, "touchPoints": points})

    send("touchStart", start)
    for step in range(1, 11):
        send("touchMove", round(start + (end - start) * step / 10))
        page.wait_for_timeout(26)
    send("touchEnd")


def scroll_document(page, session):
    if session is None:
        return
    start = page.evaluate("""() => {
        window.auditTouchMoves = [];
        const observe = event => setTimeout(() => window.auditTouchMoves.push(event.defaultPrevented), 0);
        window.addEventListener('touchmove', observe, {capture: true, passive: true});
        window.addEventListener('touchend', () => window.removeEventListener('touchmove', observe, true),
                                {capture: true, once: true});
        return scrollY;
    }""")
    swipe(page, session, 101, 580, 360)
    page.wait_for_function("start => scrollY > start + 65", arg=start)
    moves = page.evaluate("window.auditTouchMoves")
    assert moves and not any(moves), f"Touchmove was cancelled on {page.url}: {moves}"
    # Inertial scrolling may continue after touchend. A stationary finger
    # should not cause a jump back toward the start of the gesture.
    page.wait_for_timeout(300)
    assert page.evaluate("scrollY") > start + 65, f"Scroll snapped back on {page.url}"


def preview(page):
    title = page.locator("main button[data-project-id]").first
    title.tap()
    expect(title).to_have_attribute("aria-expanded", "true")
    media = title.locator("..").locator("video, img").first
    expect(media).to_be_visible()
    title.tap()
    expect(title).to_have_attribute("aria-expanded", "false")


def navigation(page, base, session):
    page.goto(base + "/grid", wait_until="domcontentloaded")
    logo = page.locator('header [data-emblem][data-motion-theme] img:visible')
    expect(logo).to_be_visible()
    assert logo.evaluate("""async img => {
        const file = new TextDecoder('latin1').decode(await (await fetch(img.currentSrc)).arrayBuffer());
        return file.includes('ANIM') && file.split('ANMF').length > 2;
    }"""), "The loaded emblem asset has no animation frames"
    page.wait_for_function("""() => {
        const v = document.querySelector('main video');
        return v && !v.paused && v.currentTime > .12;
    }""")
    scroll_document(page, session)
    nav(page, "List", "/list")
    preview(page)
    scroll_document(page, session)
    nav(page, "Gallery", "/gallery")
    scroll_document(page, session)
    nav(page, "Production", "/production/folder")
    folder = page.get_by_role("main", name="Production Folder")
    expect(folder).to_be_visible()
    if session:
        before = folder.get_attribute("data-reel-position")
        swipe(page, session, 120, 580, 360)
        page.wait_for_function(
            "before => document.querySelector('[data-reel-position]')?.dataset.reelPosition !== before", arg=before
        )
    # An actual tap at the centre of the screen must open the card underneath.
    target = page.wait_for_function("""() => {
        for (const button of document.querySelectorAll('main button[aria-label^="Preview "]')) {
            const b = button.getBoundingClientRect(), x = b.x + b.width/2, y = b.y + b.height/2;
            if (y > innerHeight*.36 && y < innerHeight*.75 && button.contains(document.elementFromPoint(x,y)))
                return {x, y};
        }
    }""").json_value()
    page.touchscreen.tap(target["x"], target["y"])
    expect(folder.locator('button[aria-expanded="true"]')).to_have_count(1)
    nav(page, "List", "/production/list")
    preview(page)
    nav(page, "Gallery", "/production/gallery")
    scroll_document(page, session)
    nav(page, "Roll", "/production/roll")
    expect(page.get_by_role("main", name="Production Roll")).to_be_visible()
    nav(page, "Info", "/info")
    expect(page.get_by_role("heading", name="Get in touch", exact=True)).to_be_visible()
    nav(page, "Branding", "/grid")
    nav(page, "List", "/list")
    page.set_viewport_size(LANDSCAPE)
    preview(page)
    expect(page.get_by_role("link", name="Production", exact=True)).to_have_attribute("href", "/production/roll")
    page.set_viewport_size(PORTRAIT)
    preview(page)


def cold_first_tap(page, base):
    # Hold all application JavaScript: the SSR header must already receive a
    # real tap rather than waiting on hydration, the counter or video decoding.
    page.route(re.compile(r"/_next/static/.*\.js(?:[?].*)?$"), lambda route: route.abort())
    page.goto(base + "/grid", wait_until="domcontentloaded")
    small_targets = page.locator("header nav a:visible").evaluate_all("""links => links.filter(a => {
        const {width, height} = a.getBoundingClientRect();
        return width < 44 || height < 44;
    }).map(a => a.textContent)""")
    assert not small_targets, f"Mobile navigation targets smaller than 44 CSS pixels: {small_targets}"
    info = page.get_by_role("link", name="Info", exact=True)
    point = info.evaluate("""a => {
        const r = a.getBoundingClientRect(), x = r.x + r.width / 2, y = r.y + r.height / 2;
        return {x, y, receivesTap: a.contains(document.elementFromPoint(x, y))};
    }""")
    assert point["receivesTap"], "Intro covers the Info link while application JavaScript is unavailable"
    page.touchscreen.tap(point["x"], point["y"])
    page.wait_for_url(lambda target: urlparse(target).path == "/info")
    emblem = page.locator('header [data-edit-id="lockup-emblem"] [data-emblem]')
    expect(emblem).to_be_visible()
    # Decode the asset actually painted without hydration, including a CSS fallback.
    assert emblem.evaluate(r"""async el => {
        const image = Array.from(el.querySelectorAll('img')).find(im =>
            im.complete && im.naturalWidth && getComputedStyle(im).visibility === 'visible' &&
            getComputedStyle(im).opacity !== '0' && im.getBoundingClientRect().width > 0);
        if (image) return true;
        const background = getComputedStyle(el).backgroundImage.match(/^url\(["']?(.*?)["']?\)$/);
        if (!background) return false;
        const fallback = new Image();
        fallback.src = background[1];
        await fallback.decode();
        return fallback.naturalWidth > 0;
    }"""), "No decoded emblem while application scripts are unavailable"


def media_after_scroll(page, base):
    requested = []
    page.on("request", lambda request: requested.append(urlparse(request.url).path))
    page.goto(base + "/grid", wait_until="domcontentloaded")
    first = page.locator('main video[aria-label="High Bay"]').first
    expect(first).to_have_attribute("src", "/projects/hightbay.mp4")
    assert not any("lumio" in path for path in requested), "Lumio loaded before scrolling"
    assert page.locator("main video[src]").count() <= 2, "Too many active project videos"
    lumio = page.locator('main img[alt="Lumio"]').first
    lumio.scroll_into_view_if_needed()
    page.wait_for_function("""() => {
        const img = document.querySelector('main img[alt="Lumio"]');
        return img.complete && img.naturalWidth && img.currentSrc.includes('/previews/');
    }""")
    expect(first).not_to_have_attribute("src", "/projects/hightbay.mp4")
    assert "/projects/lumio.webp" not in requested and "/projects/lumio.png" not in requested
    page.evaluate("window.scrollTo({top: 0, behavior: 'instant'})")
    expect(first).to_have_attribute("src", "/projects/hightbay.mp4")


def blocked_autoplay(page, base):
    # Model Safari rejecting unprompted playback. Only a real trusted input
    # directed at the tile unlocks the original play() and decodes real frames.
    page.add_init_script("""(() => {
        const play = HTMLMediaElement.prototype.play;
        let tapped = false;
        document.addEventListener('click', e => {
            if (e.isTrusted && e.target.closest('main button')) tapped = true;
        }, true);
        HTMLMediaElement.prototype.play = function () {
            if (!tapped) return Promise.reject(new DOMException('Autoplay denied', 'NotAllowedError'));
            return play.call(this);
        };
    })()""")
    page.goto(base + "/grid", wait_until="domcontentloaded")
    card = page.locator("main [data-hover-card]").first
    button = card.get_by_role("button", name="Play High Bay", exact=True)
    expect(button).to_be_visible()
    poster = card.locator("img").first
    expect(poster).to_be_visible()
    assert poster.evaluate("img => img.decode().then(() => img.naturalWidth > 0)")
    tile = card.locator("video")
    button.tap()
    tile.evaluate("""video => new Promise((resolve, reject) => {
        const started = performance.now();
        function check() {
            if (!video.paused && video.currentTime > .12) resolve();
            else if (performance.now() - started > 10000) reject(Error('Project video did not advance after tap'));
            else setTimeout(check, 65);
        }
        check();
    })""")
    expect(button).not_to_be_visible()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("url", nargs="?", default="http://127.0.0.1:3000")
    parser.add_argument("--engine", choices=["webkit", "chromium", "both"], default="both")
    parser.add_argument("--chromium-path")
    args = parser.parse_args()
    base = args.url.rstrip("/")
    with sync_playwright() as pw:
        for engine in (["webkit", "chromium"] if args.engine == "both" else [args.engine]):
            options = {"executable_path": args.chromium_path} if engine == "chromium" and args.chromium_path else {}
            browser = getattr(pw, engine).launch(**options)
            profile = dict(pw.devices["iPhone 14 Pro Max"], viewport=PORTRAIT)
            profile.pop("default_browser_type", None)
            try:
                for check in (cold_first_tap, navigation, media_after_scroll, blocked_autoplay):
                    context = browser.new_context(**profile)
                    page = context.new_page()
                    page.set_default_timeout(10000)
                    try:
                        if check == navigation:
                            session = context.new_cdp_session(page) if engine == "chromium" else None
                            check(page, base, session)
                        else:
                            check(page, base)
                        print(f"PASS {engine} {check.__name__}", flush=True)
                    finally:
                        context.close()
            finally:
                browser.close()


if __name__ == "__main__":
    main()
