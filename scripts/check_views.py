"""Inspect the views on a running build, using the installed Python Playwright.

    python scripts/check_views.py http://127.0.0.1:3000 --output /tmp/view-audit

Both a touch WebKit viewport and a desktop Chromium viewport exercise every route
and every Production project. --output retains timestamped measurements and JPEGs.
"""
import argparse
import base64
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import expect, sync_playwright

PRODUCTION = ("Value", "Raif Vision Conference", "Forma Houseboat", "Новогоднее OLV Манеры",
              "Fashion Summer Awards 2026", "Fashion TV", "РК Манеры", "Манеры OLV")
ROUTES = ("/grid", "/list", "/gallery", "/info", "/production/list",
          "/production/gallery", "/production/roll", "/production/folder")


def activate(locator, touch):
    if touch:
        locator.tap()
    else:
        locator.click()


def settle(page):
    page.wait_for_function("""() => [...document.querySelectorAll('main')].some(main =>
        main.getBoundingClientRect().height && !main.innerText.trim().startsWith('Loading projects'))""")
    expect(page.get_by_text("Loading projects…", exact=True)).not_to_be_visible()
    expect(page.locator("[data-mobile-intro]")).not_to_be_visible(timeout=6000)
    expect(page.get_by_role("switch")).to_be_visible()


def path_is(page, path):
    page.wait_for_url(lambda url: urlparse(url).path == path)


def navigate(page, name, path, touch):
    activate(page.get_by_role("navigation").get_by_role("link", name=name, exact=True), touch)
    path_is(page, path)
    settle(page)


def assert_header(page, theme):
    expected = "rgb(0, 0, 0)" if theme == "dark" else "rgb(255, 255, 255)"
    expect(page.locator("header")).to_have_css("background-color", expected)


def screenshot(page, filename):
    if filename:
        page.screenshot(path=str(filename), type="jpeg", quality=76, scale="css")


def route_matrix(page, base, touch, output, records):
    for path in ROUTES:
        response = page.goto(base + path, wait_until="domcontentloaded")
        assert response and response.ok, f"{path}: {response and response.status}"
        settle(page)
        theme = page.evaluate("document.documentElement.classList.contains('dark') ? 'dark' : 'light'")
        if touch:
            assert_header(page, theme)
        main = page.get_by_role("main")
        if path.endswith("/list"):
            expected = PRODUCTION if path.startswith("/production") else ("High Bay", "Skripka", "Lumio")
            labels = main.locator("button[data-project-id]").all_text_contents()
            assert all(name in labels for name in expected), f"{path}: {labels}"
        elif path.endswith("/gallery") or path == "/grid":
            expect(main.locator("video").first).to_be_visible()
        elif path == "/info":
            for heading in ("Capabilities", "AI Capabilities", "Get in touch"):
                expect(main.get_by_role("heading", name=heading, exact=True)).to_have_count(1)
            links = main.locator("a").evaluate_all("a => a.map(e => e.getAttribute('href'))")
            assert "https://t.me/martinmuur" in links and any(link.startswith("mailto:") for link in links)
        else:
            expect(main).to_have_attribute("aria-label", "Production " + path.split("/")[-1].title())
        page.evaluate("document.fonts.ready")
        screenshot(page, output / (path.strip("/").replace("/", "-") + ".jpg") if output else None)
        records[path] = page.locator("header nav a:visible").evaluate_all("""links => links.map(a => {
            const b = a.getBoundingClientRect(); return [a.textContent, Math.round(b.x), Math.round(b.y)];
        })""")
    for entry, end in (("/", "/grid"), ("/production", "/production/folder" if touch else "/production/roll"),
                       ("/grid?motion=classic", "/grid")):
        page.goto(base + entry, wait_until="domcontentloaded")
        path_is(page, end)
        settle(page)
        if "classic" in entry:
            assert "motion=classic" in page.url
            expect(page.locator("main [data-hover-card]").first).to_be_visible()
            expect(page.locator("[data-project-grid].mobile-flat-grid")).to_have_count(0)

    # Walk the same links a visitor uses, then use the browser history rather
    # than reconstructing URLs. Covers routes reached cold and through the app.
    for label, path in (("List", "/list"), ("Gallery", "/gallery"), ("Info", "/info"),
                        ("Production", "/production/folder" if touch else "/production/roll"),
                        ("List", "/production/list"), ("Gallery", "/production/gallery"),
                        ("Folder", "/production/folder"), ("Roll", "/production/roll"), ("Branding", "/grid")):
        navigate(page, label, path, touch)
    page.go_back()
    path_is(page, "/production/roll")
    settle(page)
    page.go_forward()
    path_is(page, "/grid")


def mobile_chrome(page, base, output):
    # Compare the header itself against the real page background in both themes.
    # Scrolling Info must not let its letters paint through the header.
    page.goto(base + "/info", wait_until="domcontentloaded")
    settle(page)
    for theme in ("dark", "light"):
        if not page.locator("html").evaluate("(e, t) => e.classList.contains(t)", theme):
            page.get_by_role("switch").tap()
        assert_header(page, theme)
        page.evaluate('''() => Promise.all(document.getAnimations().filter(a => {
            const t = a.effect?.getComputedTiming(); return t && Number.isFinite(t.endTime) && t.endTime <= 1500;
        }).map(a => a.finished.catch(() => {})))''')
        page.evaluate("scrollTo({top:0, behavior:'instant'})")
        first = page.locator("main section").first.bounding_box()
        h = page.locator("header").bounding_box()
        assert first["y"] >= h["y"] + h["height"] - 1, "Info starts inside the mobile header"
        page.evaluate("scrollTo({top: Math.round(innerHeight * .28), behavior:'instant'})")
        page.wait_for_function("scrollY > 60")
        # Remove exactly the moving content, keeping layout intact. The header
        # crop should be visually identical in a deterministic, reduced-motion run.
        header = page.locator("header")
        normal = header.screenshot(scale="css")
        main = page.get_by_role("main").element_handle()
        main.evaluate("e => e.style.visibility = 'hidden'")
        try:
            underlying_hidden = header.screenshot(scale="css")
            if normal != underlying_hidden and output:
                (output / f"header-{theme}-normal.png").write_bytes(normal)
                (output / f"header-{theme}-hidden.png").write_bytes(underlying_hidden)
            assert normal == underlying_hidden, f"Page content paints through {theme} header"
        finally:
            main.evaluate("e => e.style.removeProperty('visibility')")
        screenshot(page, output / f"info-scrolled-{theme}.jpg" if output else None)
    for path in ("/production/folder", "/production/roll"):
        page.goto(base + path, wait_until="domcontentloaded")
        settle(page)
        bounds = page.evaluate("""() => {
            const rect = el => el.getBoundingClientRect();
            const header = rect(document.querySelector('header'));
            const stage = rect(document.querySelector('main [class*="reelStage"]'));
            const theme = rect(document.querySelector('[role=switch]'));
            const count = document.querySelector('main [class*="folderCount"]');
            const lower = count ? rect(count).top : innerHeight;
            return {header:header.bottom, top:stage.top, bottom:stage.bottom,
                    controls:theme.top >= header.bottom ? Math.min(theme.top,lower) : lower};
        }""")
        assert bounds["top"] >= bounds["header"] - 1, f"{path}: stage under header: {bounds}"
        assert bounds["bottom"] <= bounds["controls"] + 1, f"{path}: stage under theme switch: {bounds}"


def painted_media(page, locator, path, title, output):
    # Inspect a real screenshot crop. A decoded file, a visible box, or a
    # nonzero playback clock can all coexist with a black or transparent tile.
    expect(locator).to_be_visible()
    page.wait_for_function("""v => {
        const p = v.parentElement.querySelector('img');
        return (v.readyState >= 2 && !v.paused) || (p && p.complete && p.naturalWidth);
    }""", arg=locator.element_handle())
    valid = False
    for _ in range(4):
        rect = locator.bounding_box()
        viewport = page.viewport_size
        x, y = max(rect["x"], 0), max(rect["y"], 0)
        right = min(rect["x"] + rect["width"], viewport["width"])
        bottom = min(rect["y"] + rect["height"], viewport["height"])
        if right - x > 15 and bottom - y > 15:
            # Sample the middle of the viewport-visible part to exclude captions,
            # rounded corners and edge shadows around the active project.
            width, height = right - x, bottom - y
            clip = dict(x=round(x + width*.12), y=round(y + height*.14),
                        width=max(1, round(width*.76)), height=max(1, round(height*.72)))
            data = page.screenshot(clip=clip, type="jpeg", quality=65, scale="css")
            score = page.evaluate("""async src => {
                const im = new Image(); im.src = src; await im.decode();
                const c = document.createElement('canvas'); c.width = 40; c.height = 32;
                const cx = c.getContext('2d'); cx.drawImage(im,0,0,40,32);
                const a = cx.getImageData(0,0,40,32).data, levels = [];
                for(let i=0;i<a.length;i+=4) levels.push((a[i]+a[i+1]+a[i+2])/3);
                levels.sort((x,y)=>x-y);return levels[Math.floor(levels.length*.97)]-levels[Math.floor(levels.length*.03)];
            }""", "data:image/jpeg;base64," + base64.b64encode(data).decode())
            if score > 8:
                valid = True
                if output:
                    (output / f"{path.rsplit('/',1)[-1]}-{title}.jpg").write_bytes(data)
                break
        page.wait_for_timeout(250)
    assert valid, f"{path}, {title}: no painted artwork in selected preview"
    return round(score, 1)


def advancing_video(page, video, touch):
    handle = video.element_handle()
    # On a phone only two Gallery tiles autoplay. Explicitly choose this one if
    # the budget or browser policy made the manual control appear.
    page.wait_for_function("""v => (!v.paused && v.readyState >= 2) ||
        v.parentElement.querySelector('button, [class*="play"]')""", arg=handle)
    button = video.locator("..").get_by_role("button")
    if button.count() and button.is_visible():
        activate(button, touch)
    elif video.evaluate("v => v.paused"):
        parent = video.locator("xpath=ancestor::button[1]")
        if parent.count():
            activate(parent, touch)
    # Require a later presented frame as well as a running clock. A poster-only
    # tile can otherwise satisfy checks for visibility or decoded dimensions.
    return video.evaluate("""v => new Promise((resolve,reject) => {
        const timer = setTimeout(() => reject(Error('No advancing frames: '+v.ariaLabel)), 7500);
        const first = v.currentTime;
        function sample(now, frame) {
            const t = frame?.mediaTime ?? v.currentTime;
            if (!v.paused && v.readyState >= 2 && v.videoWidth && v.parentElement.dataset.frameReady === 'true'
                && Math.abs(t-first) > .10) { clearTimeout(timer); resolve(t); }
            else schedule();
        }
        function schedule(){ if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(sample);
                             else requestAnimationFrame(sample); }
        schedule();
    })""")

def productions(page, base, touch, output, records):
    for mode in ("list", "gallery", "folder", "roll"):
        path = "/production/" + mode
        page.goto(base + path, wait_until="domcontentloaded")
        settle(page)
        main = page.get_by_role("main")
        scores = {}
        order = ("Fashion TV", *[n for n in PRODUCTION if n != "Fashion TV"]) if mode == "roll" else PRODUCTION
        for index, title in enumerate(order):
            if mode in ("roll", "folder"):
                if index:
                    page.keyboard.press("ArrowDown")
                expect(main).to_have_attribute("data-reel-position", str(index))
                card = main.locator(f'[data-reel-card="{index}"]')
                if mode == "folder":
                    control = card.get_by_role("button", name="Preview " + title, exact=True)
                    # Folder stacks perspective planes. A card can be only partly
                    # exposed even when its geometric centre lies behind a neighbour.
                    point = page.wait_for_function("""button => {
                        const b=button.getBoundingClientRect();
                        for(const dy of [.5,.25,.75,.1,.9])
                            for(const dx of [.5,.25,.75,.1,.9]){
                                const x=b.x+b.width*dx,y=b.y+b.height*dy;
                                if(button.contains(document.elementFromPoint(x,y))) return {x,y};
                            }
                    }""", arg=control.element_handle()).json_value()
                    if touch:
                        page.touchscreen.tap(point["x"],point["y"])
                    else:
                        page.mouse.click(point["x"],point["y"])
                    expect(control).to_have_attribute("aria-expanded", "true")
                    page.wait_for_function("el => Number(el.dataset.folderOpening) > .94", arg=main.element_handle())
                else:
                    expect(card.locator("p")).to_contain_text(title)
                video = card.locator("video")
            elif mode == "list":
                button = main.get_by_role("button", name=title, exact=True).first
                button.evaluate("el => el.scrollIntoView({block:'center',behavior:'instant'})")
                if touch:
                    button.tap()
                    expect(button).to_have_attribute("aria-expanded", "true")
                    video = button.locator("..").locator("video")
                    video.evaluate("el => el.scrollIntoView({block:'center',behavior:'instant'})")
                else:
                    button.hover()
                    video = main.locator(".opacity-100 video")
            else:
                video = main.locator(f'video[aria-label="{title}"]').first
                video.evaluate("el => el.scrollIntoView({block:'center',behavior:'instant'})")
            expect(video).to_have_attribute("aria-label", title)
            timestamp = advancing_video(page, video, touch)
            scores[title] = {"media_time": round(timestamp, 3),
                             "contrast": painted_media(page, video, path, title, output)}
        records[path + " playback"] = scores


def media_unavailable(page, base):
    # A failed MP4 must still render the correct poster on the stage: checking a
    # 200 for the webp or naturalWidth alone cannot detect an invisible layer.
    page.route("**/*.mp4", lambda route: route.abort("timedout"))
    for mode in ("roll", "folder"):
        path = "/production/" + mode
        page.goto(base + path, wait_until="domcontentloaded")
        settle(page)
        main = page.get_by_role("main")
        card = main.locator('[data-reel-card="0"]')
        video = card.locator("video")
        name = video.get_attribute("aria-label")
        poster = video.locator("..").locator("img")
        expect(poster).to_be_visible()
        page.wait_for_function("p => p.complete && p.naturalWidth > 0", arg=poster.element_handle())
        painted_media(page, video, path, name, None)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("url")
    parser.add_argument("--output", type=Path)
    parser.add_argument("--device", choices=("mobile", "desktop", "both"), default="both")
    parser.add_argument("--chromium-path")
    args = parser.parse_args()
    with sync_playwright() as pw:
        for device in ("mobile", "desktop") if args.device == "both" else (args.device,):
            touch = device == "mobile"
            engine = pw.webkit if touch else pw.chromium
            browser = engine.launch(**({"executable_path": args.chromium_path} if args.chromium_path and not touch else {}))
            profile = dict(pw.devices["iPhone 14 Pro Max"]) if touch else {"viewport": {"width":1440, "height":900}}
            profile.pop("default_browser_type", None)
            page = browser.new_page(**profile, reduced_motion="reduce")
            page.set_default_timeout(8000)
            output = args.output / device if args.output else None
            if output:
                output.mkdir(exist_ok=True, parents=True)
            record = {"started_utc": datetime.now(timezone.utc).isoformat(), "base": args.url}
            try:
                route_matrix(page, args.url.rstrip("/"), touch, output, record)
                if touch:
                    mobile_chrome(page, args.url.rstrip("/"), output)
                productions(page, args.url.rstrip("/"), touch, output, record)
                if touch:
                    media_unavailable(page, args.url.rstrip("/"))
                record["result"] = "pass"
                print(f"PASS {device} all routes, history, and 32 production previews", flush=True)
            finally:
                if output:
                    (output / "results.json").write_text(json.dumps(record, ensure_ascii=False, indent=2))
                browser.close()


if __name__ == "__main__":
    main()
