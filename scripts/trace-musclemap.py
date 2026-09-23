#!/usr/bin/env python3
"""
trace-musclemap.py — ONE-TIME tracing tool for the Wave 4 muscle heatmap
(UI-REDESIGN-WAVE-STATE.md ruling 7).

Input:  public/musclemap-{male,female}.webp — Kerwin's ChatGPT art. Each image
        holds TWO figures side by side: front view (left half) and back view
        (right half), drawn muscle segments separated by near-black outlines.

Pipeline (proven feasible 2026-09-23, recorded in the wave-state doc):
  threshold gray > 42  ->  4-connected components  ->  one component per drawn
  muscle segment  ->  fill shading holes  ->  cv2.findContours (external)  ->
  approxPolyDP-simplified SVG path  ->  region record with id/centroid/bbox.

Output per sex (scripts/musclemap/):
  {sex}-regions.json   [{id, side: 'front'|'back', cx, cy, bbox, area, d}]
  {sex}-overlay.png    debug art: each region tinted a distinct color with its
                       id printed at the centroid — used to hand-build the
                       region-id -> muscle-key label table.

This script does NOT assign muscle labels; the label table is authored
separately (per-sex, checked in) after visually reading the overlay.
"""
import json
import os
import sys

import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "scripts", "musclemap")
os.makedirs(OUT_DIR, exist_ok=True)

GRAY_THRESHOLD = 42     # outlines/background are darker than this
MIN_AREA = 120          # px^2 — drop specks (fingernail-scale noise)
EPSILON_FRAC = 0.004    # approxPolyDP epsilon as fraction of arc length


def path_d(contour):
    pts = contour.reshape(-1, 2)
    parts = [f"M{pts[0][0]},{pts[0][1]}"]
    parts += [f"L{x},{y}" for x, y in pts[1:]]
    return "".join(parts) + "Z"


def trace(sex):
    src_path = os.path.join(ROOT, "public", f"musclemap-{sex}.webp")
    img = cv2.imread(src_path)
    if img is None:
        raise SystemExit(f"cannot read {src_path}")
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    mask = (gray > GRAY_THRESHOLD).astype(np.uint8)

    n, labels, stats, centroids = cv2.connectedComponentsWithStats(mask, connectivity=4)
    regions = []
    overlay = img.copy()
    rng = np.random.default_rng(7)

    for i in range(1, n):
        x, y, bw, bh, area = stats[i]
        if area < MIN_AREA:
            continue
        # component mask, holes filled: take external contour only
        comp = (labels[y:y + bh, x:x + bw] == i).astype(np.uint8)
        comp = cv2.morphologyEx(comp, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
        contours, _ = cv2.findContours(comp, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            continue
        cnt = max(contours, key=cv2.contourArea)
        eps = EPSILON_FRAC * cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, eps, True)
        if len(approx) < 3:
            continue
        approx = approx + np.array([x, y])  # back to full-image coords
        cx, cy = centroids[i]
        rid = len(regions)
        regions.append({
            "id": rid,
            "side": "front" if cx < w / 2 else "back",
            "cx": round(float(cx), 1),
            "cy": round(float(cy), 1),
            "bbox": [int(x), int(y), int(bw), int(bh)],
            "area": int(area),
            "d": path_d(approx),
        })
        color = tuple(int(c) for c in rng.integers(60, 255, 3))
        cv2.drawContours(overlay, [approx], -1, color, -1)
        cv2.putText(overlay, str(rid), (int(cx) - 8, int(cy) + 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 0, 0), 2, cv2.LINE_AA)
        cv2.putText(overlay, str(rid), (int(cx) - 8, int(cy) + 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.42, (255, 255, 255), 1, cv2.LINE_AA)

    with open(os.path.join(OUT_DIR, f"{sex}-regions.json"), "w") as f:
        json.dump({"width": w, "height": h, "regions": regions}, f)
    cv2.imwrite(os.path.join(OUT_DIR, f"{sex}-overlay.png"), overlay)
    print(f"{sex}: {len(regions)} regions ({w}x{h}) -> {OUT_DIR}/{sex}-regions.json + overlay")


if __name__ == "__main__":
    for sex in (sys.argv[1:] or ["male", "female"]):
        trace(sex)
