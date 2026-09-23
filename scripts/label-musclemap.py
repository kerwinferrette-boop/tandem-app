#!/usr/bin/env python3
"""
label-musclemap.py — assigns a display-muscle key to every traced region from
scripts/trace-musclemap.py, using anatomical position heuristics on the
figure-normalized centroid, then renders a colored verification overlay
({sex}-labelcheck.png) so the assignment is verified AT THE PIXEL, not assumed.

Display keys are the heatmap's vocabulary; tandem.html aggregates the app's 43
muscleCeilingKey groups into these (one rule one home: that aggregation table
lives in tandem.html next to the renderer; THIS file only owns geometry->key).

Coordinates: nx in [0,1] across the FIGURE bbox (0=left), ny in [0,1] down the
figure (0=head top). dx = |nx - 0.5| distance from figure midline.
"""
import json
import os

import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "scripts", "musclemap")

PALETTE = {  # BGR for cv2
    "pec_major": (60, 60, 230), "anterior_delt": (0, 160, 255),
    "lateral_delt": (0, 210, 255), "posterior_delt": (0, 255, 200),
    "bicep_brachii": (80, 255, 80), "tricep": (30, 190, 30),
    "forearm": (200, 255, 120), "rectus_abdominis": (255, 120, 60),
    "oblique_external": (255, 200, 0), "quad": (255, 80, 200),
    "adductor": (180, 0, 220), "calf": (120, 120, 255),
    "upper_trap": (255, 255, 0), "lat_dorsi": (0, 90, 255),
    "rhomboid": (140, 220, 255), "erector_spinae": (60, 255, 255),
    "glute_max": (255, 0, 120), "hamstring": (200, 100, 255),
    "rotator": (100, 160, 190), "drop": (70, 70, 70),
}


def classify_front(nx, ny, dx, area):
    if ny < 0.155:
        return "drop"                       # head + neck
    if ny > 0.925:
        return "drop"                       # feet
    arm = dx > 0.26 or (dx > 0.22 and ny > 0.30 and ny < 0.55 and area < 2600)
    if arm:
        if ny < 0.205:
            return "lateral_delt" if dx > 0.30 else "anterior_delt"
        if ny < 0.24:
            return "anterior_delt" if dx < 0.33 else "lateral_delt"
        if ny < 0.355:
            return "bicep_brachii"
        if ny < 0.52:
            return "forearm"
        return "drop"                       # hands
    # torso / legs (central column)
    if ny < 0.175 and dx < 0.12:
        return "drop"                       # neck base / sternocleidomastoid
    if ny < 0.20:
        return "pec_major" if dx < 0.20 else "anterior_delt"
    if ny < 0.265:
        return "pec_major" if dx < 0.185 else "oblique_external"
    if ny < 0.46:
        if dx < 0.105:
            return "rectus_abdominis"
        return "oblique_external"
    if ny < 0.50:
        return "quad" if dx > 0.06 else "drop"   # pelvis midline
    if ny < 0.695:
        if dx < 0.075 and ny < 0.60:
            return "adductor"
        return "quad"
    if ny > 0.895:
        return "drop"                        # ankle/foot top
    return "calf"                            # shin/anterior lower leg -> calf bucket


def classify_back(nx, ny, dx, area):
    if ny < 0.145:
        return "drop"                        # head
    if ny > 0.925:
        return "drop"                        # feet
    arm = dx > 0.26 or (dx > 0.225 and 0.30 < ny < 0.55 and area < 2600)
    if arm:
        if ny < 0.235:
            return "posterior_delt"
        if ny < 0.36:
            return "tricep"
        if ny < 0.52:
            return "forearm"
        return "drop"                        # hands
    if ny < 0.205:
        return "upper_trap" if dx < 0.17 else "posterior_delt"
    if ny < 0.315:
        if dx < 0.10:
            return "rhomboid"
        if ny < 0.26:
            return "rotator" if dx < 0.235 else "posterior_delt"  # infraspinatus/teres on the scapula
        return "lat_dorsi"
    if ny < 0.42:
        if dx < 0.075:
            return "erector_spinae"
        return "lat_dorsi"
    if ny < 0.475:
        return "erector_spinae" if dx < 0.10 else "glute_max"
    if ny < 0.545:
        return "glute_max"
    if ny < 0.72:
        return "hamstring"
    if ny > 0.895:
        return "drop"                        # ankle/heel
    return "calf"


def label(sex):
    with open(os.path.join(OUT, f"{sex}-regions.json")) as f:
        data = json.load(f)
    regions = data["regions"]

    # figure bboxes per side, from region extents
    figs = {}
    for side in ("front", "back"):
        rs = [r for r in regions if r["side"] == side]
        x0 = min(r["bbox"][0] for r in rs)
        x1 = max(r["bbox"][0] + r["bbox"][2] for r in rs)
        y0 = min(r["bbox"][1] for r in rs)
        y1 = max(r["bbox"][1] + r["bbox"][3] for r in rs)
        figs[side] = (x0, y0, x1 - x0, y1 - y0)

    labels = {}
    for r in regions:
        fx, fy, fw, fh = figs[r["side"]]
        nx = (r["cx"] - fx) / fw
        ny = (r["cy"] - fy) / fh
        dx = abs(nx - 0.5)
        fn = classify_front if r["side"] == "front" else classify_back
        labels[str(r["id"])] = fn(nx, ny, dx, r["area"])

    # manual per-region overrides authored after visual verification
    ov_path = os.path.join(OUT, f"{sex}-label-overrides.json")
    if os.path.exists(ov_path):
        with open(ov_path) as f:
            labels.update(json.load(f))

    with open(os.path.join(OUT, f"{sex}-labels.json"), "w") as f:
        json.dump(labels, f, indent=0)

    # verification overlay
    img = cv2.imread(os.path.join(ROOT, "public", f"musclemap-{sex}.webp"))
    for r in regions:
        key = labels[str(r["id"])]
        pts = np.array([[int(float(n)) for n in p.split(",")]
                        for p in r["d"][1:-1].replace("L", ";").split(";")
                        for p in [p.replace("M", "")]], dtype=np.int32)
        cv2.drawContours(img, [pts], -1, PALETTE[key], -1)
        cv2.drawContours(img, [pts], -1, (0, 0, 0), 1)
    y = 24
    for k, c in PALETTE.items():
        cv2.rectangle(img, (8, y - 12), (24, y + 2), c, -1)
        cv2.putText(img, k, (30, y), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)
        y += 20
    cv2.imwrite(os.path.join(OUT, f"{sex}-labelcheck.png"), img)
    counts = {}
    for v in labels.values():
        counts[v] = counts.get(v, 0) + 1
    print(sex, json.dumps(counts, indent=0))


if __name__ == "__main__":
    import sys
    for sex in (sys.argv[1:] or ["male", "female"]):
        label(sex)
