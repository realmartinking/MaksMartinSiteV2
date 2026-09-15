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

Six normal-speed source ranges at 24 fps produce exactly 240 frames. Cuts are direct; no synthetic frames, retiming, or still-image substitutions are used.

| Source range, seconds (end exclusive) | Frames | Beat |
| --- | ---: | --- |
| 0.50–2.00 | 36 | Market and shoe fitting |
| 3.75–4.75 | 24 | Boy looking up |
| 7.50–8.75 | 30 | Girl and arches |
| 9.00–10.25 | 30 | Red tie falling to the ground |
| 11.50–14.00 | 60 | Children becoming adults in the new architecture |
| 17.50–20.00 | 60 | Building, Манеры title and Ингрупп end card |

Rebuild with `python3 scripts/prepare-production-media.py /path/to/sources --ffmpeg /path/to/ffmpeg`. Use `--only manery-olv-10s.mp4` to rebuild the short edit alone. Source edits live in frame indices in that script.

## Folder blur correction

The neighboring video content receives up to 5 px Gaussian blur. Filtering a finite rectangle introduces transparent pixels around its border. Clipping that layer at its original size exposed the black background as a dark inner rim.

The inner layer now scales just enough to keep 3.5 blur radii of source padding outside the fixed crop. Padding and scale follow the same opening clock as the blur; they return to zero and identity on close. The selected card is never zoomed or blurred. Plane dimensions, perspective, layout, ten-strip closed stack, and three foreground strips remain unchanged. No additional video decoder or animation loop is created.

## Verification

The encoded loops contain 354, 120, 597 and 240 frames respectively: 14.75 s, 5 s, 9.95 s and 10 s at their preserved frame rates. MP4 headers precede media data for progressive playback. Combined web payload: 31,207,194 bytes.

Local browser checks verified all eight List titles and Gallery sources, the corrected Roll captions, playback of the new 1920×1080 videos, and Roll wrapping from index 7 to index 8 / Value while retaining seven DOM planes. Folder selection keeps the chosen layer at `filter: none; transform: none`; neighboring content reaches `blur(5px)` with a measured scale of 1.12111 at 1422×800. White and yellow edges no longer show the prior dark fringe. Escape restores all 21 inner layers to `none` for both properties. Sixteen motion/entrance tests include coverage of the blur padding throughout opening and eight-project wrapping. Browser rendering checks use the in-app Chromium browser; direct Safari verification remains outside this run.
