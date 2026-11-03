"""Build lightweight mobile previews from the eight existing Production web masters."""
from argparse import ArgumentParser
from pathlib import Path
from subprocess import run

parser = ArgumentParser(description=__doc__)
parser.add_argument("--ffmpeg", default="ffmpeg")
args = parser.parse_args()
projects = Path(__file__).resolve().parents[1] / "public" / "projects"
mobile = projects / "mobile"
mobile.mkdir(exist_ok=True)
# Keep the complete edits. Value alone starts after its verified 0.5s black leader.
# Sample each poster at a representative visible frame from the same source.
assets = [
    ("value", 24, 0.5, 1.0), ("raif", 25, 0, 0.4),
    ("forma", 24, 0, 0.4), ("manery", 24, 0, 0.4),
    ("fashion-summer-awards-2026", 24, 0, 0.4), ("fashion-tv", 24, 0, 0.4),
    ("manery-campaign", 30, 0, 0.4), ("manery-olv-10s", 24, 0, 0.4),
]
for name, fps, start, poster_time in assets:
    prefix = [args.ffmpeg, "-hide_banner", "-nostdin", "-loglevel", "error", "-y"]
    source = str(projects / f"{name}.mp4")
    run(prefix + ["-ss", str(start), "-i", source, "-map", "0:v:0", "-an",
        "-vf", f"fps={fps},scale=854:480:flags=lanczos,setsar=1", "-c:v", "libx264",
        "-preset", "slow", "-profile:v", "main", "-level", "3.1", "-crf", "23",
        "-maxrate", "1000k", "-bufsize", "1000k", "-g", str(fps * 2),
        "-pix_fmt", "yuv420p", "-threads", "3", "-movflags", "+faststart",
        str(mobile / f"{name}.mp4")], check=True)
    run(prefix + ["-ss", str(poster_time), "-i", source, "-frames:v", "1",
        "-vf", "scale=854:480:flags=lanczos", "-c:v", "libwebp", "-quality", "78",
        "-preset", "picture", str(mobile / f"{name}.webp")], check=True)
