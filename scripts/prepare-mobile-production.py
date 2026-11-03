"""Build phone loops and frame-matched Production posters; never overwrite Branding assets.

For initial Forma/Raif desktop exports, pass --studio-sources /path/to/Проекты
(the folder containing Forma Houseboat/ and Raif Vision Conference/).
Subsequent phone encodes only need the checked-in desktop files.
"""
from argparse import ArgumentParser
from pathlib import Path
from subprocess import run

parser = ArgumentParser(description=__doc__)
parser.add_argument("--ffmpeg", default="ffmpeg")
parser.add_argument("--studio-sources", type=Path)
parser.add_argument("--posters-only", action="store_true")
parser.add_argument("--only", choices=["value", "raif", "forma", "manery", "fashion-summer-awards-2026",
                                      "fashion-tv", "manery-campaign", "manery-olv-10s"])
args = parser.parse_args()
projects = Path(__file__).resolve().parents[1] / "public" / "projects"
mobile = projects / "mobile"
production = projects / "production"
for directory in (production / "posters", mobile):
    directory.mkdir(parents=True, exist_ok=True)

def ffmpeg(*cmd):
    run([args.ffmpeg, "-hide_banner", "-nostdin", "-loglevel", "error", "-y", *cmd], check=True)

enhanced = {"forma", "raif"}
shared_with_branding = {"value", "raif", "forma", "manery"}
fps_by_name = {"value": 24, "raif": 25, "forma": 24, "manery": 24, "fashion-summer-awards-2026": 24,
               "fashion-tv": 24, "manery-campaign": 30, "manery-olv-10s": 24}
for name, fps in fps_by_name.items():
    if args.only and args.only != name:
        continue
    source = (production if name in enhanced else projects) / f"{name}.mp4"
    if args.studio_sources and name == "forma":
        # The supplied 5s/24fps cut is already H.264. Keep the video stream unchanged.
        ffmpeg("-i", args.studio_sources / "Forma Houseboat/Forma Houseboat.mp4", "-map", "0:v:0",
               "-an", "-map_metadata", "-1", "-c:v", "copy", "-movflags", "+faststart", source)
    if args.studio_sources and name == "raif":
        # This GIF is the approved edit. The longer .mov files are different cuts.
        ffmpeg("-ignore_loop", "1", "-i", args.studio_sources / "Raif Vision Conference/Raif Vision.gif",
               "-frames:v", "230", "-an", "-vf", "fps=25,scale=out_color_matrix=bt709:flags=accurate_rnd,format=yuv420p,gblur=sigma=0.45",
               "-c:v", "libx264", "-crf", "17", "-preset", "slow", "-maxrate", "8000k", "-bufsize", "8000k", "-g", "50", "-pix_fmt", "yuv420p",
               "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
               "-threads", "4", "-movflags", "+faststart", source)
    phone = mobile / f"{name}.mp4"
    if not args.posters_only:
        size, quality, maxrate, level = ("1280:720", "19", "3000k", "3.1") if name in enhanced else ("854:480", "23", "1000k", "3.1")
        ffmpeg("-i", source, "-map", "0:v:0", "-an", "-vf", f"fps={fps},scale={size}:flags=lanczos,setsar=1",
               "-c:v", "libx264", "-preset", "slow", "-profile:v", "main", "-level", level, "-crf", quality,
               "-maxrate", maxrate, "-bufsize", maxrate, "-g", str(fps * 2), "-pix_fmt", "yuv420p",
               "-threads", "3", "-movflags", "+faststart", phone)
    # The native player hides its poster at the first presented frame. For Value
    # that is the first picture after its intentional black leader (posterUntil).
    start = "0.5" if name == "value" else "0"
    desktop_poster_dir = (production if name in shared_with_branding else projects) / "posters"
    for movie, poster in [(source, desktop_poster_dir / f"{name}.webp"), (phone, mobile / f"{name}.webp")]:
        ffmpeg("-ss", start, "-i", movie, "-frames:v", "1", "-c:v", "libwebp", "-preset", "picture",
               "-quality", "88", poster)
