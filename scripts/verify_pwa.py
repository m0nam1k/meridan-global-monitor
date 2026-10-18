#!/usr/bin/env python3
"""Dependency-free checks for MERIDIAN's installable GitHub Pages application."""
import json
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / "manifest.webmanifest").read_text(encoding="utf-8"))
html = (ROOT / "index.html").read_text(encoding="utf-8")
sw = (ROOT / "sw.js").read_text(encoding="utf-8")
assert manifest["display"] == "standalone"
assert manifest["scope"] == "./" and manifest["start_url"].startswith("./")
assert '<link rel="manifest"' in html
assert 'rel="apple-touch-icon"' in html
assert 'src="pwa.js?v=pwa1"' in html
assert "meridian-pwa-" in sw
assert "u.origin!==self.location.origin" in sw
assert "u.pathname.includes('/data/')" in sw
for icon in manifest["icons"]:
    assert (ROOT / icon["src"]).is_file(), icon["src"]

def verify_png(name, dimension):
    data = (ROOT / name).read_bytes()
    assert data.startswith(b"\x89PNG\r\n\x1a\n"), f"PNG signature invalid: {name}"
    pos, seen, payload = 8, [], b""
    while pos < len(data):
        size = struct.unpack_from(">I", data, pos)[0]
        tag = data[pos + 4:pos + 8]
        chunk = data[pos + 8:pos + 8 + size]
        crc = struct.unpack_from(">I", data, pos + 8 + size)[0]
        assert zlib.crc32(tag + chunk) == crc, f"Bad PNG CRC in {name}: {tag}"
        if tag == b"IHDR":
            w, h = struct.unpack_from(">II", chunk)
            assert (w, h) == (dimension, dimension), f"Bad icon size: {name}"
        if tag == b"IDAT":
            payload += chunk
        seen.append(tag)
        pos += size + 12
    assert seen[-1] == b"IEND", f"PNG end chunk absent: {name}"
    pixels = zlib.decompress(payload)
    assert len(pixels) == dimension * (dimension + 1), f"Bad scanline count: {name}"

verify_png("icons/apple-touch-icon.png", 180)
verify_png("icons/icon-192.png", 192)
verify_png("icons/icon-512.png", 512)
for name in ["index.html", "styles.css", "app.js", "pwa.js", "offline.html", "sw.js"]:
    assert (ROOT / name).stat().st_size > 200, f"{name} empty"
print("MERIDIAN PWA checks passed.")
