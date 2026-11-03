"""Check the original emblem/count entrance, hold and exit, including without Next's client chunks."""
import re


def mobile_intro(page, base):
    # Sample the *painted* state, including intervals when the number is already
    # at 100. Progress text alone misses the original blur, lift and outer fade.
    page.add_init_script("""(() => {
      const trace = window.introTrace = {frames:[], started:0, released:0, fade:null};
      // The app itself starts the final fade. Inspect its actual CSS animation
      // at two known instants, instead of hoping a CI compositor delivers a
      // sampled frame in this 300ms interval. Restore its clock immediately.
      function probeFade(gate) {
        const info = document.querySelector('header a[href="/info"]');
        const style = getComputedStyle(gate);
        const animations = gate.getAnimations().filter(a=>a.effect?.target===gate);
        const durations = animations.map(a=>a.effect.getTiming().duration);
        const probe = trace.fade = {durations, samples:[], name:style.animationName,
          percent:gate.querySelector('[data-mobile-progress]')?.textContent,
          root:document.documentElement.dataset.intro, at:performance.now()};
        const fade = animations.find(a => a.effect.getTiming().duration===300);
        if (!info || !fade) return;
        const time=fade.currentTime, start=fade.startTime, state=fade.playState;
        try {
          fade.pause();
          const b=info.getBoundingClientRect(), x=b.x+b.width/2, y=b.y+b.height/2;
          for (const ms of [30, 200]) {
            fade.currentTime=ms;
            const hit=document.elementFromPoint(x,y);
            probe.samples.push({ms, opacity:+style.opacity, visibility:style.visibility,
              pointer:style.pointerEvents, receives:info.contains(hit), hit:hit?.tagName});
          }
        } finally {
          fade.currentTime=time ?? 0;
          if (state!=='paused') {
            fade.play();
            if (start!==null) fade.startTime=start;
          }
        }
      }
      // A busy browser may paint its first frame well after the gate opened.
      // Time its actual lifetime separately from the sampled animation frames.
      const lifecycle = new MutationObserver(records => {
        for (const r of records) {
          if (!r.target.hasAttribute('data-intro-overlay')) continue;
          if (r.attributeName==='data-intro-releasing') {
            if (r.target.hasAttribute('data-intro-releasing') && !trace.fade) probeFade(r.target);
            continue;
          }
          if (r.target.hasAttribute('data-mobile-intro')) {
            if (!trace.started) trace.started = performance.now();
          } else if (trace.started) {
            trace.released = performance.now();
            lifecycle.disconnect();
          }
        }
      });
      lifecycle.observe(document, {subtree:true, attributes:true, attributeFilter:['data-mobile-intro','data-intro-releasing']});
      let last = -Infinity;
      function sample(t) {
        const overlay = document.querySelector('[data-intro-overlay]'),
              group = overlay?.querySelector('[data-intro-group]'),
              label = overlay?.querySelector('[data-mobile-progress]'),
              emblem = overlay?.querySelector('[data-preloader-emblem]');
        if (!overlay?.hasAttribute('data-mobile-intro')) {
          if(trace.released) return;
        } else if(group && label && emblem && t-last>=34) {
          last=t;
          const st=getComputedStyle(overlay), art=getComputedStyle(group);
          const er=emblem.getBoundingClientRect(), nr=label.getBoundingClientRect();
          // A CSS fallback may paint before the animated file or the app is available.
          const visual=emblem.querySelector('[data-emblem]');
          const hasArt=visual && (getComputedStyle(visual).backgroundImage!=='none' ||
            [...visual.querySelectorAll('img')].some(i=>i.complete && i.naturalWidth && getComputedStyle(i).visibility==='visible'));
          const film = emblem.querySelector('[data-intro-film]');
          const retina = film && overlay.hasAttribute('data-intro-film-ready') && getComputedStyle(film).opacity==='1'
            && film.videoWidth >= Math.min(er.width * devicePixelRatio - 2, 432)
            && film.videoHeight >= Math.min(er.height * devicePixelRatio - 2, 540);
          const hit=(x,y)=>overlay.contains(document.elementFromPoint(x,y));
          const matrix=art.transform==='none'?null:new DOMMatrixReadOnly(art.transform);
          trace.frames.push({t,n:parseInt(label.textContent,10),a:+art.opacity,blur:parseFloat(art.filter.match(/[0-9.]+/)||0),
            lift:matrix?.m42||0, gap:nr.left-er.right, centerY:Math.abs((nr.y+nr.height/2)-(er.y+er.height/2)),
            width:er.width, height:er.height, fg:art.color, bg:st.backgroundColor, art:!!hasArt,
            retina:!!retina, mediaTime:film?.currentTime ?? 0,
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
        duration = trace["released"]-trace["started"]
        assert values[0] <= 8 and values[-1] == 100 and values == sorted(values), (condition, values)
        assert len(set(values)) >= 10 and 2700 <= duration < 3800, (condition, duration, values)
        steady = [f for f in frames if 40 <= f["n"] <= 85]
        assert steady and all(f["art"] and f["a"] >= .93 and f["blur"] < 1 and abs(f["lift"]) < 2 and
            f["cover"] and f["opacity"] >= .99 and f["bg"] in ("rgb(0, 0, 0)", "rgb(255, 255, 255)")
            and 22 <= f["gap"] <= 26 and f["centerY"] <= 3 and f["height"]>=120 for f in steady), (
                condition, "emblem and count did not occupy the original opaque centred row", steady)
        decoded = [f["mediaTime"] for f in frames if f["retina"] and f["a"] > .92]
        assert decoded and max(decoded) - min(decoded) > .15, (
            condition, "the sharp mobile emblem must show advancing frames while the introduction is visible")
        assert any(f["n"]<17 and f["blur"]>1 and f["lift"]>2 and f["a"]<.9 for f in frames), (
            condition, "missing original entrance")
        assert any(f["n"]==100 and f["blur"]>2 and f["lift"] < -3 and f["a"]<.85 for f in frames), (
            condition, "missing original exit")
        fade = trace["fade"] or {}
        samples = fade.get("samples", [])
        assert (fade.get("root") == "ready" and fade.get("percent") == "100%"
                and len(samples) == 2 and 0 < samples[1]["opacity"] < samples[0]["opacity"] < 1
                and all(f["receives"] and f["pointer"] == "none" and f["visibility"] == "visible"
                        for f in samples)), (
            condition, "the real release must fade visibly and pass taps to Info",
            {"start": trace["started"], "finish": trace["released"], "fade": fade,
             "last_frames": [(f["t"],f["n"],f["opacity"],f["cover"],f["releasing"]) for f in frames[-4:]]})
        receives_tap = page.locator('header a[href="/info"]').evaluate("""a => {
          const r=a.getBoundingClientRect();
          return a.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));
        }""")
        assert receives_tap, f"{condition}: intro still intercepts navigation"
        print(f"  intro ({condition}): {values[0]} → {values[-1]}%, fades and releases in {duration:.0f} ms")
