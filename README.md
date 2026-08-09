# Blockscape

A web-based Minecraft-style **2D platformer** you can play on Android (and any modern phone browser).

Mine blocks, gather resources, build bridges and towers, and explore a procedurally generated blocky world.

## Play on your phone

**Play online (lasting public URL — works on cellular):**  
https://blockscape-nephew.surge.sh

Or run it yourself and open from your phone on the same Wi‑Fi:

```bash
python3 -m http.server 8080
```

On Android Chrome: open the URL above (or `http://<your-computer-ip>:8080`), tap **PLAY**, then use on-screen controls:
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
