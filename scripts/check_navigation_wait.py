"""Distinguish a pending SPA transition from a slow full-document load."""

import re
from urllib.parse import urlparse

from playwright.sync_api import expect


def slow_navigation(page, base):
    blocked = {"/info", "/list"}
    held = []
    page.add_init_script("""(() => {
      const documents = JSON.parse(sessionStorage.getItem('documentVisits') || '[]');
      documents.push(location.pathname);
      sessionStorage.setItem('documentVisits', JSON.stringify(documents));
    })()""")

    def hold_route_data(route):
        request = route.request
        path = urlparse(request.url).path
        if path in blocked and request.resource_type in ("fetch", "xhr"):
            held.append(route)
        else:
            route.continue_()

    page.route(re.compile(r"/(?:info|list)(?:[?].*)?$"), hold_route_data)
    page.goto(base + "/grid", wait_until="domcontentloaded")
    expect(page.get_by_role("switch")).to_be_attached()
    expect(page.locator("[data-mobile-intro]")).not_to_be_visible(timeout=4000)
    page.evaluate("window.beforeNavigation = true")
    info = page.locator('header a[href="/info"]')
    info.tap()
    expect(info.locator("[data-navigation-pending]")).to_be_attached()
    expect(info).to_have_css("text-decoration-style", "dotted")
    expect(page.locator("main [data-project-grid]")).to_be_visible()
    expect(page.get_by_text("Loading projects…", exact=True)).not_to_be_visible()

    blocked.remove("/info")
    for route in list(held):
        if urlparse(route.request.url).path == "/info":
            route.continue_()
    expect(page.get_by_role("heading", name="Get in touch", exact=True)).to_be_visible()
    assert page.evaluate("window.beforeNavigation"), \
        "A successful transition unnecessarily reloaded the document"

    listing = page.locator('header a[href="/list"]')
    listing.tap()
    expect(listing.locator("[data-navigation-pending]")).to_be_attached()
    expect(page.get_by_role("heading", name="Get in touch", exact=True)).to_be_visible()
    page.wait_for_url(lambda target: urlparse(target).path == "/list", timeout=9000, wait_until="domcontentloaded")
    documents = page.evaluate("JSON.parse(sessionStorage.getItem('documentVisits'))")
    assert documents == ["/grid", "/list"], f"Expected one native recovery, got {documents}"
    assert not page.evaluate("Boolean(window.beforeNavigation)"), "No new document after blocked navigation"
    expect(page.locator("[data-mobile-intro]")).not_to_be_visible()
    expect(page.locator("main button[data-project-id]").first).to_be_visible()
    blocked.clear()
    for route in list(held):
        if urlparse(route.request.url).path == "/list":
            route.abort()
    page.unroute_all(behavior="wait")
