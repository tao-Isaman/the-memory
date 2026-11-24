#!/usr/bin/env python3
"""Build-time animator for the Loy Krathong scene maps.

Each static scene map (1024x1536 .webp) becomes a short seamless loop:
  - water   : moving moonlight glints on the river
  - stars   : scattered twinkle in the night sky
  - lights  : gentle warm flicker on lanterns / windows / string lights
  - foliage : a soft wind sway on trees / palms / bushes (trunks & buildings untouched)

Frame 0 is the original map (reused at runtime via mapUrl), so we only emit the
extra frames  <scene>-a1.webp .. <scene>-a{N-1}.webp .  The loop is phase-based
(phase = 2*pi*i/N) so it cycles frame0 -> a1 -> .. -> frame0 with no visible seam.

Pure PIL only (no numpy): every effect is built from vectorised PIL ops
(point / ImageChops / composite / transform) — no Python per-pixel loops over the
full image, so it runs in a few seconds per scene.

Usage:
  python3 scripts/loykrathong/gen_scene_frames.py            # all scenes
  python3 scripts/loykrathong/gen_scene_frames.py village    # one scene
  python3 scripts/loykrathong/gen_scene_frames.py --check    # report sizes, no write
"""
import math
import os
import sys
from PIL import Image, ImageChops, ImageFilter, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GAME = os.path.join(ROOT, "public", "game", "loykrathong")
W, H = 1024, 1536
FRAMES = 4  # total frames in the loop incl. frame 0

# Per-scene geometry hints (map px). Water bands come from config.ts lanes;
# sky is the band above the treeline. Values picked to match the art.
SCENES = {
    "village":   {"water_y": 950,  "sky_y": 210},
    "temple":    {"water_y": 860,  "sky_y": 230},
    "bangkok":   {"water_y": 300,  "sky_y": 150, "water_y2": 1040},
    "chiangmai": {"water_y": 1010, "sky_y": 230},
}


def band_mask(y0, y1, feather=24):
    """Vertical soft band mask (white inside [y0,y1], feathered edges)."""
    m = Image.new("L", (W, H), 0)
    inner = Image.new("L", (W, y1 - y0), 255)
    m.paste(inner, (0, y0))
    if feather:
        m = m.filter(ImageFilter.GaussianBlur(feather))
    return m


def water_mask(sc):
    """Blue-dominant pixels inside the water band(s)."""
    r, g, b = sc["img"].split()
    # b - r  and  b - g  positive  => blueish
    br = ImageChops.subtract(b, r, scale=1, offset=0)
    bg = ImageChops.subtract(b, g, scale=1, offset=0)
    blue = ImageChops.multiply(br.point(lambda v: 255 if v > 6 else 0),
                               bg.point(lambda v: 255 if v > 0 else 0))
    bright = b.point(lambda v: 255 if v > 55 else 0)
    blue = ImageChops.multiply(blue, bright)
    band = band_mask(sc["cfg"]["water_y"], H, feather=40)
    if "water_y2" in sc["cfg"]:
        band = ImageChops.lighter(band, band_mask(sc["cfg"].get("water_top_y", 250),
                                                   sc["cfg"]["water_y2"] - 480, feather=30)) \
            if False else band  # bangkok upper river handled by main band is enough
    m = ImageChops.multiply(blue, band)
    return m.filter(ImageFilter.GaussianBlur(1))


def star_mask(sc):
    """Near-white bright specks in the sky band (stars + moon rim)."""
    r, g, b = sc["img"].split()
    mn = ImageChops.darker(ImageChops.darker(r, g), b)  # min channel
    bright = mn.point(lambda v: 255 if v > 150 else 0)
    band = band_mask(0, sc["cfg"]["sky_y"], feather=30)
    return ImageChops.multiply(bright, band)


def warm_mask(sc):
    """Warm, bright pixels: lanterns, windows, string lights (R high, R>B)."""
    r, g, b = sc["img"].split()
    rb = ImageChops.subtract(r, b, scale=1, offset=0)
    warm = ImageChops.multiply(r.point(lambda v: 255 if v > 150 else 0),
                               rb.point(lambda v: 255 if v > 28 else 0))
    # keep some green (amber/pink) not pure red noise
    warm = ImageChops.multiply(warm, g.point(lambda v: 255 if v > 60 else 0))
    return warm.filter(ImageFilter.GaussianBlur(1))


def foliage_mask(sc):
    """Green-dominant leafy pixels (excludes brown trunks, grey roofs, water)."""
    r, g, b = sc["img"].split()
    gr = ImageChops.subtract(g, r, scale=1, offset=0)
    gb = ImageChops.subtract(g, b, scale=1, offset=0)
    green = ImageChops.multiply(gr.point(lambda v: 255 if v > 8 else 0),
                                gb.point(lambda v: 255 if v > 8 else 0))
    green = ImageChops.multiply(green, g.point(lambda v: 255 if v > 45 else 0))
    # drop the lower water/pier area
    band = band_mask(0, sc["cfg"]["water_y"] + 30, feather=30)
    green = ImageChops.multiply(green, band)
    return green.filter(ImageFilter.GaussianBlur(1))


# ---- a reusable horizontal "glint" texture that tiles over the width -------
def glint_texture(period, contrast):
    """1px-tall sine stripe, 0..255, tiling every `period` px; stretched to H."""
    row = bytearray(W)
    for x in range(W):
        row[x] = int(127 + contrast * math.sin(2 * math.pi * x / period))
    line = Image.frombytes("L", (W, 1), bytes(row))
    return line.resize((W, H))


def ripple_texture(period_y, period_x, contrast):
    """Fine moonlight-ripple field: horizontal streaks (short y-period) with a
    slow x-variation ADDED (not multiplied, so no big blobs). Only the positive
    half is kept as highlight, so water sparkles rather than darkening."""
    clamp = lambda v: 0 if v < 0 else (255 if v > 255 else int(v))
    col = bytearray(H)
    for y in range(H):
        col[y] = clamp(127 + contrast * math.sin(2 * math.pi * y / period_y))
    gy = Image.frombytes("L", (1, H), bytes(col)).resize((W, H))
    row = bytearray(W)
    for x in range(W):
        row[x] = clamp(127 + (contrast * 0.5) * math.sin(2 * math.pi * x / period_x))
    gx = Image.frombytes("L", (W, 1), bytes(row)).resize((W, H))
    # average the two, then keep only the bright half as a sparkle highlight
    avg = ImageChops.add(gy.point(lambda v: v // 2), gx.point(lambda v: v // 2))
    return avg.point(lambda v: max(0, (v - 150)) * 3)  # highlights only, 0..~300->clip


def make_frame(sc, i, masks, tex):
    """Build frame i (i>=1). Returns an RGB image = base + animated deltas."""
    phase = 2 * math.pi * i / FRAMES
    base = sc["img"]
    out = base.copy()

    # --- water: scroll the ripple field slowly and add a faint highlight ----
    shift = int(round(W * i / FRAMES))
    glint = ImageChops.offset(tex["water"], int(shift * 0.25), shift)  # drift mostly vertical
    glint = ImageChops.multiply(glint, masks["water"])
    # faint additive highlight, cool moonlight tint
    out = ImageChops.add(out, Image.merge("RGB", (
        glint.point(lambda v: int(v * 0.10)),
        glint.point(lambda v: int(v * 0.13)),
        glint.point(lambda v: int(v * 0.17)),
    )))

    # --- stars: twinkle subset by phase band --------------------------------
    tw = tex["twphase"].point(lambda v, i=i: 255 if (v % FRAMES) == i else 0)
    stars = ImageChops.multiply(masks["star"], tw)
    glow = ImageChops.add(
        Image.merge("RGB", (stars.point(lambda v: int(v * 0.55)),
                            stars.point(lambda v: int(v * 0.55)),
                            stars.point(lambda v: int(v * 0.65)))),
        Image.new("RGB", (W, H), 0))
    out = ImageChops.add(out, glow)
    # and slightly dim the stars that are *not* peaking, for contrast
    dimmask = ImageChops.multiply(masks["star"], tw.point(lambda v: 255 - v))
    out = ImageChops.subtract(out, Image.merge("RGB", (
        dimmask.point(lambda v: int(v * 0.18)),
        dimmask.point(lambda v: int(v * 0.18)),
        dimmask.point(lambda v: int(v * 0.14)))))

    # --- warm lights: gentle breathing flicker (phase-split, low amp) -------
    amp = int(22 * math.sin(phase))            # +/- brightness
    wl = tex["wlphase"].point(lambda v, i=i: 255 if (v % FRAMES) == i else 90)
    warm = ImageChops.multiply(masks["warm"], wl).point(lambda v: v)
    if amp >= 0:
        out = ImageChops.add(out, Image.merge("RGB", (
            warm.point(lambda v: int(v / 255 * amp)),
            warm.point(lambda v: int(v / 255 * amp * 0.8)),
            warm.point(lambda v: int(v / 255 * amp * 0.4)))))
    else:
        warmneg = warm.point(lambda v: int(v / 255 * (-amp)))
        out = ImageChops.subtract(out, Image.merge("RGB", (
            warmneg, warmneg.point(lambda v: int(v * 0.8)),
            warmneg.point(lambda v: int(v * 0.4)))))

    return out


def foliage_sway(out, sc, masks, i):
    """Soft wind: shift the foliage layer by a tiny per-band amount, feathered
    so trunks/buildings underneath stay put. Amplitude <= 2px."""
    phase = 2 * math.pi * i / FRAMES
    fol = sc["img"].copy()
    # band the foliage into 6 horizontal strips, each shifted a hair more toward
    # the canopy top (less at the base) — a gentle shear.
    bands = 6
    composed = out.copy()
    top = 0
    region_h = sc["cfg"]["water_y"] // bands
    for bi in range(bands):
        y0 = bi * region_h
        y1 = (bi + 1) * region_h if bi < bands - 1 else sc["cfg"]["water_y"]
        # more sway near the top of the tree (smaller bi), gentle ease
        sway = (1.0 - bi / bands) * 2.0 * math.sin(phase + bi * 0.5)
        dx = int(round(sway))
        if dx == 0:
            continue
        strip = fol.crop((0, y0, W, y1))
        shifted = ImageChops.offset(strip, dx, 0)
        mstrip = masks["foliage"].crop((0, y0, W, y1))
        # paste shifted foliage only through the (feathered) foliage mask
        region = composed.crop((0, y0, W, y1))
        region = Image.composite(shifted, region, mstrip)
        composed.paste(region, (0, y0))
    return composed


def process(name, write=True, with_foliage=True, qa=False):
    path = os.path.join(GAME, f"{name}.webp")
    img = Image.open(path).convert("RGB")
    sc = {"img": img, "cfg": SCENES[name]}
    masks = {
        "water": water_mask(sc),
        "star": star_mask(sc),
        "warm": warm_mask(sc),
        "foliage": foliage_mask(sc),
    }
    # precomputed phase textures (which star/light peaks on which frame)
    noise = Image.effect_noise((W, H), 48).convert("L")
    tex = {
        "water": ripple_texture(26, 150, 150),
        "twphase": noise,                       # value % FRAMES = star's peak frame
        "wlphase": Image.effect_noise((W, H), 60).convert("L"),
    }
    sizes = []
    for i in range(1, FRAMES):
        fr = make_frame(sc, i, masks, tex)
        if with_foliage:
            fr = foliage_sway(fr, sc, masks, i)
        out_path = os.path.join(GAME, f"{name}-a{i}.webp")
        if write:
            fr.save(out_path, "WEBP", quality=82, method=4)
            sizes.append((os.path.basename(out_path), os.path.getsize(out_path)))
    if write and qa:
        # dump the region masks for visual tuning (debug only, not shipped)
        qadir = os.path.join(ROOT, "scripts", "loykrathong", "qa")
        os.makedirs(qadir, exist_ok=True)
        for k, m in masks.items():
            m.save(os.path.join(qadir, f"{name}-mask-{k}.png"))
    return sizes


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    flags = [a for a in sys.argv[1:] if a.startswith("-")]
    names = args or list(SCENES.keys())
    write = "--check" not in flags
    with_foliage = "--no-foliage" not in flags
    qa = "--qa" in flags
    total = 0
    for n in names:
        sizes = process(n, write=write, with_foliage=with_foliage, qa=qa)
        for fn, sz in sizes:
            total += sz
            print(f"  {fn:24s} {sz/1024:7.1f} KB")
    print(f"total extra frames: {total/1024:.1f} KB across {len(names)} scene(s)"
          f"  ({FRAMES-1} frames/scene)")


if __name__ == "__main__":
    main()
