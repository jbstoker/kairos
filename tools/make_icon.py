"""Generate web/icon-192.png — a gold sun on the Kairos night background.

Pure standard-library PNG writer; no PIL required.

Usage:
    python tools/make_icon.py
"""

import math
import os
import struct
import zlib

SIZE = 192
BG = (11, 14, 20)        # #0b0e14
GOLD = (240, 194, 127)   # #f0c27f
RING = (42, 54, 74)      # subtle orbit ring

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "web", "icon-192.png")


def chunk(tag, data):
    return (struct.pack(">I", len(data)) + tag + data +
            struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF))


def pixel_color(x, y):
    dx, dy = x - SIZE / 2, y - SIZE / 2
    r = math.hypot(dx, dy)
    if r <= 60:
        return GOLD
    if 70 <= r <= 74:
        return RING
    return BG


def main():
    raw = bytearray()
    for y in range(SIZE):
        raw.append(0)  # filter type 0
        for x in range(SIZE):
            raw.extend(pixel_color(x, y))

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "wb") as f:
        f.write(png)
    print(f"Wrote {os.path.abspath(OUT)} ({len(png)} bytes)")


if __name__ == "__main__":
    main()
