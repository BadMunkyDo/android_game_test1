/** Block definitions and pixel textures for Blockscape */

export const BLOCK = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  WOOD: 4,
  LEAVES: 5,
  SAND: 6,
  COAL: 7,
  IRON: 8,
  GOLD: 9,
  BEDROCK: 10,
  PLANKS: 11,
  BRICK: 12,
};

export const BLOCK_META = {
  [BLOCK.AIR]: { name: "Air", solid: false, breakable: false, hardness: 0, drops: null },
  [BLOCK.GRASS]: { name: "Grass", solid: true, breakable: true, hardness: 0.35, drops: BLOCK.DIRT },
  [BLOCK.DIRT]: { name: "Dirt", solid: true, breakable: true, hardness: 0.3, drops: BLOCK.DIRT },
  [BLOCK.STONE]: { name: "Stone", solid: true, breakable: true, hardness: 0.85, drops: BLOCK.STONE },
  [BLOCK.WOOD]: { name: "Wood", solid: true, breakable: true, hardness: 0.55, drops: BLOCK.WOOD },
  [BLOCK.LEAVES]: { name: "Leaves", solid: true, breakable: true, hardness: 0.15, drops: BLOCK.LEAVES },
  [BLOCK.SAND]: { name: "Sand", solid: true, breakable: true, hardness: 0.25, drops: BLOCK.SAND },
  [BLOCK.COAL]: { name: "Coal", solid: true, breakable: true, hardness: 1.0, drops: BLOCK.COAL },
  [BLOCK.IRON]: { name: "Iron", solid: true, breakable: true, hardness: 1.2, drops: BLOCK.IRON },
  [BLOCK.GOLD]: { name: "Gold", solid: true, breakable: true, hardness: 1.15, drops: BLOCK.GOLD },
  [BLOCK.BEDROCK]: { name: "Bedrock", solid: true, breakable: false, hardness: 99, drops: null },
  [BLOCK.PLANKS]: { name: "Planks", solid: true, breakable: true, hardness: 0.4, drops: BLOCK.PLANKS },
  [BLOCK.BRICK]: { name: "Brick", solid: true, breakable: true, hardness: 0.9, drops: BLOCK.BRICK },
};

const PALETTES = {
  [BLOCK.GRASS]: ["#3f8f2f", "#5aad3a", "#2f6b22", "#8b5a2b"],
  [BLOCK.DIRT]: ["#8b5a2b", "#6e4520", "#a06a38", "#5a3618"],
  [BLOCK.STONE]: ["#8a8a8a", "#6f6f6f", "#9c9c9c", "#5c5c5c"],
  [BLOCK.WOOD]: ["#6b4423", "#8a5a30", "#4e3018", "#a06a3c"],
  [BLOCK.LEAVES]: ["#3d8c34", "#2f6e28", "#58b048", "#245a1e"],
  [BLOCK.SAND]: ["#e0c878", "#c9b05f", "#f0d890", "#b89a4a"],
  [BLOCK.COAL]: ["#4a4a4a", "#2e2e2e", "#6a6a6a", "#1a1a1a"],
  [BLOCK.IRON]: ["#8a8a8a", "#c0c0c0", "#6f6f6f", "#d8d8d8"],
  [BLOCK.GOLD]: ["#8a8a8a", "#e0b820", "#6f6f6f", "#f0d040"],
  [BLOCK.BEDROCK]: ["#2a2a2a", "#111111", "#3a3a3a", "#000000"],
  [BLOCK.PLANKS]: ["#c49a4a", "#a87e35", "#d4aa5a", "#8a6528"],
  [BLOCK.BRICK]: ["#a84a3a", "#8a382c", "#c45a48", "#6e2a20"],
};

function hash(n) {
  n = (n ^ 61) ^ (n >>> 16);
  n = n + (n << 3);
  n = n ^ (n >>> 4);
  n = n * 0x27d4eb2d;
  n = n ^ (n >>> 15);
  return n >>> 0;
}

/** Draw an 8x8 style Minecraft-ish block into a canvas/context */
export function drawBlock(ctx, id, x, y, size, seed = 0) {
  if (id === BLOCK.AIR) return;
  const pal = PALETTES[id];
  if (!pal) return;

  const cell = size / 8;
  for (let py = 0; py < 8; py++) {
    for (let px = 0; px < 8; px++) {
      const h = hash(seed * 73856093 + id * 19349663 + px * 83492791 + py * 12347);
      let color = pal[h % 3];

      if (id === BLOCK.GRASS) {
        if (py < 2) color = pal[h & 1];
        else if (py === 2) color = (h & 1) ? pal[0] : pal[3];
        else color = (h & 7) === 0 ? "#6e4520" : pal[3];
      }

      if (id === BLOCK.WOOD && (px === 0 || px === 7 || py === 0 || py === 7)) {
        color = pal[2];
      }

      if (id === BLOCK.LEAVES && (h & 7) === 0) {
        continue; // sparse leaves
      }

      if ((id === BLOCK.COAL || id === BLOCK.IRON || id === BLOCK.GOLD) && (h & 15) < 3) {
        color = pal[3];
      }

      if (id === BLOCK.PLANKS && py % 2 === 0) {
        color = pal[px < 4 ? 0 : 1];
      }
      if (id === BLOCK.PLANKS && py % 2 === 1) {
        color = pal[px < 4 ? 1 : 0];
      }

      if (id === BLOCK.BRICK) {
        const row = Math.floor(py / 2);
        const offset = row % 2 ? 2 : 0;
        const col = Math.floor((px + offset) / 4);
        color = (col + row) % 2 ? pal[0] : pal[1];
        if (py % 2 === 0 || (px + offset) % 4 === 0) color = pal[2];
      }

      ctx.fillStyle = color;
      ctx.fillRect(x + px * cell, y + py * cell, Math.ceil(cell), Math.ceil(cell));
    }
  }

  // subtle bevel
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(x, y, size, Math.max(1, size * 0.08));
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(x, y + size - Math.max(1, size * 0.1), size, Math.max(1, size * 0.1));
}

export function makeBlockIcon(id, size = 28) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  drawBlock(ctx, id, 0, 0, size, id * 17);
  return c;
}

export const PLACEABLE = [
  BLOCK.DIRT,
  BLOCK.STONE,
  BLOCK.WOOD,
  BLOCK.PLANKS,
  BLOCK.BRICK,
  BLOCK.SAND,
  BLOCK.COAL,
  BLOCK.IRON,
  BLOCK.GOLD,
  BLOCK.LEAVES,
];
