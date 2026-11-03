"""Check the original emblem/count entrance, hold and exit, including without Next's client chunks."""
import re


def mobile_intro(page, base):
    # Sample the *painted* state, including intervals when the number is already
    # at 100. Progress text alone misses the original blur, lift and outer fade.
    page.add_init_script("""(() => {
      const trace = window.introTrace = {frames:[], released:0};
      let last = -Infinity;
      function sample(t) {
        const overlay = document.querySelector('[data-intro-overlay]'),
              group = overlay?.querySelector('[data-intro-group]'),
              label = overlay?.querySelector('[data-mobile-progress]'),
              emblem = overlay?.querySelector('[data-preloader-emblem]');
        if (!overlay?.hasAttribute('data-mobile-intro')) {
          if(trace.frames.length) {trace.released=t;return;}
        } else if(group && label && emblem && t-last>=34) {
          last=t;
          const st=getComputedStyle(overlay), art=getComputedStyle(group);
          const er=emblem.getBoundingClientRect(), nr=label.getBoundingClientRect();
          // A CSS fallback may paint before the animated file or the app is available.
          const visual=emblem.querySelector('[data-emblem]');
          const hasArt=visual && (getComputedStyle(visual).backgroundImage!=='none' ||
            [...visual.querySelectorAll('img')].some(i=>i.complete && i.naturalWidth && getComputedStyle(i).visibility==='visible'));
          const hit=(x,y)=>overlay.contains(document.elementFromPoint(x,y));
          const matrix=art.transform==='none'?null:new DOMMatrixReadOnly(art.transform);
          trace.frames.push({t,n:parseInt(label.textContent,10),a:+art.opacity,blur:parseFloat(art.filter.match(/[0-9.]+/)||0),
            lift:matrix?.m42||0, gap:nr.left-er.right, centerY:Math.abs((nr.y+nr.height/2)-(er.y+er.height/2)),
            width:er.width, height:er.height, fg:art.color, bg:st.backgroundColor, art:!!hasArt,
            cover:hit(10,12)&&hit(innerWidth/2,innerHeight/2)&&hit(innerWidth/2,innerHeight-24),
            opacity:+st.opacity, releasing:overlay.hasAttribute('data-intro-releasing')});
        }
        requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    })()""")
    for condition in ("normal", "without application scripts"):
        if condition != "normal":
            page.route(re.compile(r"/_next/static/.*\.js(?:[?].*)?$"), lambda route: route.abort())
        page.goto(base + "/grid", wait_until="domcontentloaded")
        page.wait_for_function("window.introTrace.released > 0", timeout=6500)
        trace = page.evaluate("introTrace")
        frames = trace["frames"]
        values = [f["n"] for f in frames]
        duration = trace["released"]-frames[0]["t"]
        assert values[0] <= 8 and values[-1] == 100 and values == sorted(values), (condition, values)
        assert len(set(values)) >= 10 and 2700 <= duration < 3800, (condition, duration, values)
        steady = [f for f in frames if 40 <= f["n"] <= 85]
        assert steady and all(f["art"] and f["a"] >= .93 and f["blur"] < 1 and abs(f["lift"]) < 2 and
            f["cover"] and f["opacity"] >= .99 and f["bg"] in ("rgb(0, 0, 0)", "rgb(255, 255, 255)")
            and 22 <= f["gap"] <= 26 and f["centerY"] <= 3 and f["height"]>=120 for f in steady), (
                condition, "emblem and count did not occupy the original opaque centred row", steady)
        assert any(f["n"]<17 and f["blur"]>1 and f["lift"]>2 and f["a"]<.9 for f in frames), (
            condition, "missing original entrance")
        assert any(f["n"]==100 and f["blur"]>2 and f["lift"] < -3 and f["a"]<.85 for f in frames), (
            condition, "missing original exit")
        assert any(f["n"]==100 and not f["cover"] and f["opacity"]<.99 for f in frames), (
            condition, "links remain blocked during the artwork's final fade")
        receives_tap = page.locator('header a[href="/info"]').evaluate("""a => {
          const r=a.getBoundingClientRect();
          return a.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));
        }""")
        assert receives_tap, f"{condition}: intro still intercepts navigation"
        print(f"  intro ({condition}): {values[0]} → {values[-1]}%, fades and releases in {duration:.0f} ms")
