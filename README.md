# Blockscape

A web-based Minecraft-style **2D platformer** you can play on Android (and any modern phone browser).

Mine blocks, gather resources, build bridges and towers, and explore a procedurally generated blocky world.

## Play online (public URL)

**Game (works on cellular / any network):**  
https://blockscape-game.abounding-veil.workers.dev

To keep this URL forever (do this soon — temporary previews expire):

1. Open the claim link:  
   https://dash.cloudflare.com/claim-preview?claimToken=IE_R7y-UfX7Uoy_1xifZIL0R97tcmxh7ac5zqV-PIGc
2. Sign in with Google / Apple / GitHub (free)
3. Claim the site — then the same game URL stays live for your nephew anytime

**72-hour backup mirror:**  
https://litter.catbox.moe/6mnt8g.html

After merge, you can also enable **GitHub Pages** (Settings → Pages → GitHub Actions) for:  
`https://badmunkydo.github.io/android_game_test1/`

## Controls

- **◀ ▶** move · **JUMP** leap
- Tap the world to **mine** or **place**
- **MODE** switches mine ↔ build
- Hotbar picks what you place

Desktop: `A`/`D` or arrows, `Space`/`W` jump, click world, `F`/`Q` mode.

## Run locally

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080` (or `play.html` for the single-file build).

## Tech

Static HTML / CSS / JS (ES modules). No build step required. `play.html` is a single-file bundle for easy sharing.
