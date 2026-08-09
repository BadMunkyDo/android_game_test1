# Blockscape

A web-based Minecraft-style **2D platformer** you can play on Android (and any modern phone browser).

Mine blocks, gather resources, build bridges and towers, and explore a procedurally generated blocky world.

## Play on your phone

1. Open the hosted site, **or** run it locally and visit your computer’s IP from your phone (same Wi‑Fi):

```bash
python3 -m http.server 8080
```

2. On Android Chrome: open `http://<your-computer-ip>:8080`
3. Tap **PLAY**, then use on-screen controls:
   - **◀ ▶** move
   - **JUMP** leap
   - Tap the world to **mine** (hold) or **build** (tap)
   - **MODE** switches mine ↔ build
   - Hotbar selects which block to place

Tip: Add the page to your Home Screen for a fullscreen, app-like feel.

## Desktop controls

- `A` / `D` or arrows — move  
- `Space` / `W` — jump  
- Click/drag — mine or place  
- `F` or `Q` — toggle mine/build  
- Click hotbar — select block  

## Features

- Procedural terrain with hills, deserts, caves, trees, and ores  
- Breakable blocks with mining progress + particles  
- Inventory & hotbar crafting-free building  
- Touch-first controls sized for phones  
- Runs entirely in the browser — no install  

## Tech

Static HTML / CSS / JS (ES modules). No build step required.
