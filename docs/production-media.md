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

## Production playback and media

Roll opens by default on all screen sizes. Its center, upper neighbor and lower neighbor play muted inline. Moving one position keeps the two overlapping players alive. Other Reel planes can show posters without downloading another movie. Grid and Gallery keep their separate mobile decoder budget.

Forma Houseboat uses the video stream of the supplied 1920×1080, 24 fps, five-second portfolio cut, remuxed without audio or video recompression. Raif Vision Conference uses a new 1080p H.264 encode of the supplied portfolio GIF, retaining the existing 9.2-second edit. The longer Raif and Forma films are different edits. The two Production desktop files live in `public/projects/production/`; the equivalent Branding files are unchanged. The other six desktop video files are unchanged.

Phones use a 1280×720 version of Forma and Raif and an 854×480 version of the other six, all H.264, muted, 8-bit 4:2:0 MP4 with the stream index before the video data. The campaign is sampled at 30 fps on phones; its desktop master remains 60 fps. A narrow window on a mouse-driven desktop continues to load the desktop version.

Every Production poster comes from the actual per-device file at the first frame displayed by the player. Value retains its intentional black leader and switches from the matching first picture at 0.5 s. The covers used only in Branding remain untouched.

Run `python3 scripts/prepare-mobile-production.py --ffmpeg /path/to/ffmpeg` to rebuild phone loops and both sets of posters. Use `--studio-sources /path/to/Проекты` to also rebuild the two desktop Production exports from the supplied cuts. `--only` selects one project and `--posters-only` preserves encoded video files.

| Project | Desktop MP4, bytes | Phone MP4, bytes | Phone poster, bytes |
| --- | ---: | ---: | ---: |
| Value | 526,958 | 386,451 | 2,012 |
| Raif Vision Conference | 5,854,477 | 1,382,561 | 13,110 |
| Forma Houseboat | 6,684,869 | 1,932,398 | 53,150 |
| Новогоднее OLV Манеры | 555,868 | 508,691 | 38,512 |
| Fashion Summer Awards 2026 | 11,826,307 | 1,429,446 | 39,734 |
| Fashion TV | 2,351,086 | 307,407 | 16,668 |
| РК Манеры | 9,552,546 | 1,205,506 | 31,876 |
| Манеры OLV | 8,108,886 | 1,129,526 | 43,270 |
