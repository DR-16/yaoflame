# YAO FLAME

A youth-led badminton design project by Daniel Rong, under Yao Design Lab.

Live: https://dr-16.github.io/yaoflame/

## What this is

A single-page WebGL site. Scrolling drives a camera along a fixed path through a
badminton court in eight acts — founder, positioning, design process, the three
rackets, the community donation, social impact, and an archive wall of every
document. A plain-text version lives behind the "Read as text" button, and
carries the full specification table for search engines and for anyone who just
wants to read.

English and Chinese, English by default.

## Running it locally

`python -m http.server` sends no cache headers, which makes editing painful, so
use the bundled server instead:

```
python3 devserver.py 8099 .
```

Then open http://localhost:8099 — the dev build adds an FPS/progress readout and
a few debugging hooks, all gated on `localhost`.

## Layout

- `index.html` — copy (both languages), styles, readable layer, lightbox
- `scene.js` — the whole 3D scene: court, players, fire, camera path, archive wall
- `assets/` — documents and photographs shown in the scene
- `assets/videos/` — two looping clips on the back wall (audio tracks removed so
  they autoplay unconditionally)

## Not a commercial business

This is a student concept project. The rackets were donated, not sold.
