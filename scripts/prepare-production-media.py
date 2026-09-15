"""Create the four September 2026 web loops from the supplied source files.

Usage: python3 scripts/prepare-production-media.py ~/Downloads --ffmpeg /path/to/ffmpeg
Originals are never modified. Web loops are muted, full-resolution H.264.
"""
import argparse
from pathlib import Path
import subprocess

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("sources", type=Path)
parser.add_argument("--ffmpeg", default="ffmpeg")
parser.add_argument("--only", help="Rebuild just this output filename")
args = parser.parse_args()
destination = Path(__file__).resolve().parents[1] / "public" / "projects"

jobs = [
    ("FTV_Italy_20_2.mp4", "fashion-summer-awards-2026.mp4"),
    ("FTV_Russia_Ident_01_grozd_MASTER.mp4", "fashion-tv.mp4"),
    ("Scene-1 (3).mp4", "manery-campaign.mp4"),
    ("Манеры. OLV 9.mp4", "manery-olv-10s.mp4"),
]

# Frame-accurate, normal-speed cuts at the source's 24 fps. Total: 240 frames.
# Market → boy → girl → red tie → transformation → architecture / end logo.
olv_ranges = [(12, 48), (90, 114), (180, 210), (216, 246), (276, 336), (420, 480)]
assert sum(end - start for start, end in olv_ranges) == 240

for source, output in jobs:
    if args.only and output != args.only:
        continue
    command = [args.ffmpeg, "-hide_banner", "-loglevel", "warning", "-y", "-i", str(args.sources / source)]
    if output == "manery-olv-10s.mp4":
        segments = [f"[0:v]trim=start_frame={start}:end_frame={end},setpts=PTS-STARTPTS[v{i}]"
                    for i, (start, end) in enumerate(olv_ranges)]
        segments.append("".join(f"[v{i}]" for i in range(len(olv_ranges)))
                        + f"concat=n={len(olv_ranges)}:v=1:a=0,fps=24[out]")
        command += ["-filter_complex", ";".join(segments), "-map", "[out]"]
    else:
        command += ["-map", "0:v:0"]
    command += ["-an", "-c:v", "libx264", "-crf", "18", "-preset", "slow", "-threads", "4",
                "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(destination / output)]
    print(f"Encoding {output}", flush=True)
    subprocess.run(command, check=True)
    print(f"Saved {output}: {(destination / output).stat().st_size:,} bytes", flush=True)
