# Production media — September 2026

The eight-project Production collection is independent of Branding metadata. The original 18 Branding projects and their files are retained. In Production, Value, Raif Vision Conference and Forma Houseboat use **Art Direction**. The existing Манеры copy is **Новогоднее OLV Манеры. AI Prodaction**, preserving the supplied spelling.

## Added sources

| Production title and type | Supplied source | Web asset |
| --- | --- | --- |
| Fashion Summer Awards 2026. AI Production | FTV_Italy_20_2.mp4 | fashion-summer-awards-2026.mp4 |
| Fashion TV. AI Production | FTV_Russia_Ident_01_grozd_MASTER.mp4 | fashion-tv.mp4 |
| РК Манеры. Рекламная компания | Scene-1 (3).mp4 | manery-campaign.mp4 |
| Манеры OLV. AI Production | Манеры. OLV 9.mp4 | manery-olv-10s.mp4 |

Files are in `public/projects/`. All keep 1920×1080 pixels. Fashion and OLV retain 24 fps; the campaign retains 60 fps. H.264, yuv420p and MP4 faststart are used for browser playback. CRF 18 / slow is a high-quality, lossy web encode, not a lossless copy. Website loops have no audio track; supplied originals remain unchanged outside the repository. The first three retain their full sequence.

## Ten-second OLV edit

Four normal-speed source ranges at 24 fps produce exactly 240 frames. The apple shot and scarf action start and end at their original shot boundaries; the market walk and stray five-frame fragments are excluded.

| Source frames (end exclusive) | Source seconds | Frames | Beat |
| --- | --- | ---: | --- |
| 43–76 | 1.791667–3.166667 | 33 | Complete apple shot |
| 185–236 | 7.708333–9.833333 | 51 | Uninterrupted scarf action |
| 269–365 | 11.208333–15.208333 | 96 | Children, transformation and adult couple |
| 420–480 | 17.50–20.00 | 60 | Building, Манеры title and Ингрупп end card |

Rebuild with `python3 scripts/prepare-production-media.py /path/to/sources --ffmpeg /path/to/ffmpeg`. Use `--only manery-olv-10s.mp4` to rebuild the short edit alone. Source edits live in frame indices in that script.

## Folder blur correction

The neighboring video content receives up to 5 px Gaussian blur. Filtering a finite rectangle introduces transparent pixels around its border. Clipping that layer at its original size exposed the black background as a dark inner rim.

The inner layer now scales just enough to keep 3.5 blur radii of source padding outside the fixed crop. Padding and scale follow the same opening clock as the blur; they return to zero and identity on close. The selected card is never zoomed or blurred. Plane dimensions, perspective, layout, ten-strip closed stack, and three foreground strips remain unchanged. No additional video decoder or animation loop is created.

## Verification

The encoded loops contain 354, 120, 597 and 240 frames respectively: 14.75 s, 5 s, 9.95 s and 10 s at their preserved frame rates. MP4 headers precede media data for progressive playback. Combined web payload: 31,838,825 bytes.

Local browser checks verified all eight List titles and Gallery sources, the corrected Roll captions, playback of the new 1920×1080 videos, and Roll wrapping from index 7 to index 8 / Value while retaining seven DOM planes. Folder selection keeps the chosen layer at `filter: none; transform: none`; neighboring content reaches `blur(5px)` with a measured scale of 1.12111 at 1422×800. White and yellow edges no longer show the prior dark fringe. Escape restores all 21 inner layers to `none` for both properties. Sixteen motion/entrance tests include coverage of the blur padding throughout opening and eight-project wrapping. Browser rendering checks use the in-app Chromium browser; direct Safari verification remains outside this run.

The revised edit was compared against the mapped source frame for all 240 output frames after decoding at 64×36 RGB: mean absolute channel difference 0.156/255, worst frame 0.310/255. This is a timing/foreign-frame check, not a full-resolution perceptual quality score. The 30-frame contact sheet confirms continuous apple and scarf scenes.

## Phone previews

The eight desktop masters remain in `public/projects/`. Production uses a separate 854 × 480 H.264 Main, 8-bit 4:2:0 MP4 on phones, with the stream index before the video data. The phone files retain the full edits including the original opening of Value. The campaign is sampled at 30 fps on phones; its desktop master remains 60 fps. Rebuild the eight loops and their matching posters from the checked-in masters with `python3 scripts/prepare-mobile-production.py --ffmpeg /path/to/ffmpeg`.

| Project | Desktop MP4, bytes | Phone MP4, bytes | Phone poster, bytes |
| --- | ---: | ---: | ---: |
| Value | 526,958 | 386,451 | 3,388 |
| Raif Vision Conference | 572,566 | 262,101 | 6,664 |
| Forma Houseboat | 1,078,646 | 636,740 | 13,632 |
| Новогоднее OLV Манеры | 555,868 | 508,691 | 29,984 |
| Fashion Summer Awards 2026 | 11,826,307 | 1,429,446 | 27,156 |
| Fashion TV | 2,351,086 | 307,407 | 12,100 |
| РК Манеры | 9,552,546 | 1,205,506 | 25,994 |
| Манеры OLV | 8,108,886 | 1,129,526 | 32,216 |

The eight phone loops occupy 5.87 MB in total. Folder and Roll provide their first poster in the server HTML. Gallery provides all eight posters, totalling 151 KB. The selected video gets the same poster directly on its native player until the first frame paints.
