# Scroll polish — 16 September 2026

## Requested behavior

- List line height: 0.80 → 0.78, including wrapped project names.
- Production entry: Roll on desktop, Folder at widths ≤768px. Choosing a view explicitly survives resizing.
- View navigation: List, Roll, Folder, Gallery. Fashion TV starts Roll; other views retain their project order.
- Desktop emblem and name: 7px left of the previous release; full rotation stage retained.
- Grid/List smooth scrolling and Roll share a longer exponential tail and slightly lower wheel gain. Further input remains interruptible. Roll still settles at the nearest target project.
- Mobile document scrolling follows the finger directly, with a weighted release tail. Pinch zoom bypasses smoothing. Detected iOS <16 keeps native touch.

## Performance changes

List/Grid hover no longer switches on every passing card during scrolling. Once settled, the project under the pointer receives the same preview and visual treatment. Keyboard focus remains immediate, mobile taps still expand List projects. Scroll activity uses one listener and only publishes gesture boundaries; there is no React update on every scroll frame.

Video preloading (400px ahead) is separate from continuous playback (80px ahead). Already-playing videos are not restarted by redundant observer events. Shared observers and visibility handling are cleaned up on unmount. Grid tiles are memoized, near rows retain their compositing hint while passing through the flat region, and distant rows release it.

No media file, resolution, frame rate, row perspective curve, or blur strength was reduced.

## Measurements and limits

Eight-second local development samples in the in-app Chromium 152 browser on an Intel i9-9980HK Mac with 32GB RAM, AC power and low-power mode off. CSS viewport 1422×800. Each sample used three identical automated 0.7-viewport wheel gestures. The lower wheel gain changes final travel from about 2016px to 1717px, so these are diagnostic samples, not a controlled cross-browser benchmark. Media warm-up and development compilation can contribute long tasks.

| View / build | Median frame interval | 95th percentile | Long tasks (ms) | Peak playing project videos | Video starts |
| --- | ---: | ---: | --- | ---: | ---: |
| List before | 16.7ms | 17.5ms | 161, 65 | 1 | 11 |
| List after | 16.7ms | 17.5ms | none | 1 | 1 |
| Grid before | 33.2ms | 34.3ms | 234, 61, 226 | 9 | 9 |
| Grid after | 33.1ms | 34.1ms | 161 | 4 | 8 |

A temporary Grid diagnostic with row blur disabled remained around 33ms; pausing project video playback brought the median to 16.7ms. This points to video decoding/compositing pressure as a remaining limit on this environment, rather than blur alone. Both diagnostic variants and the measurement component were removed from the shipped code. The improvement in List is clear in this sample; Grid is lighter but a universal 60fps result is not established.

Direct Safari rendering, physical iPhone touch input, and the user's other device were not available to this browser automation. Responsive layout and route selection were checked through viewport overrides. [Lenis documents Safari/pre-M1 and older iOS caveats](https://github.com/darkroomengineering/lenis#limitations); these are possible contributing factors, not proof of the user's particular Safari bottleneck.

## Verification

- TypeScript and 21 motion/playback tests: geometry, loop indexing, snapping, interruption, 30/60/120Hz damping, and both preload/play observer callback orders.
- Desktop Production opens Roll with Fashion TV centered; settled wheel position lands exactly on a project.
- Mobile Production opens Folder; List has consistent wrapping/leading and expands one inline video on tap.
- Desktop List preview plays at rest, pauses during scroll, and restores after settling.
- Final build and deployed route checks are recorded in the PR.
