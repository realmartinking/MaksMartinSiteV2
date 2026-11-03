"""Trusted mobile touch input for the Chromium/Playwright regression checks."""


def swipe(page, session, x, start, end):
    def send(event, y=None):
        points = [] if y is None else [{"x": x, "y": y}]
        session.send("Input.dispatchTouchEvent", {"type": event, "touchPoints": points})

    send("touchStart", start)
    for step in range(1, 11):
        send("touchMove", round(start + (end - start) * step / 10))
        page.wait_for_timeout(26)
    send("touchEnd")
