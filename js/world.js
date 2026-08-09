import { BLOCK, BLOCK_META } from "./blocks.js";

const TILE = 32;

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function grad(hash, x) {
  return (hash & 1) === 0 ? x : -x;
}

/** Simple 1D value noise */
function noise1(x, seed) {
  const xi = Math.floor(x);
  const xf = x - xi;
  const a = hash2(xi, seed);
  const b = hash2(xi + 1, seed);
  return lerp(a, b, fade(xf));
}

function hash2(x, seed) {
  let n = x * 374761393 + seed * 668265263;
  n = (n ^ (n >>> 13)) * 1274126177;
  n = n ^ (n >>> 16);
  return (n & 0xffff) / 0xffff;
}

function fbm(x, seed) {
  let v = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < 4; i++) {
    v += noise1(x * freq, seed + i * 19) * amp;
    amp *= 0.5;
    freq *= 2;
  }
  return v;
}

export class World {
  constructor(width = 256, height = 96) {
    this.width = width;
    this.height = height;
    this.tile = TILE;
    this.tiles = new Uint8Array(width * height);
    this.seed = (Math.random() * 1e9) | 0;
    this.generate();
  }

  idx(x, y) {
    return y * this.width + x;
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  get(x, y) {
    if (!this.inBounds(x, y)) return BLOCK.BEDROCK;
    return this.tiles[this.idx(x, y)];
  }

  set(x, y, id) {
    if (!this.inBounds(x, y)) return false;
    if (this.get(x, y) === BLOCK.BEDROCK && id !== BLOCK.BEDROCK) return false;
    this.tiles[this.idx(x, y)] = id;
    return true;
  }

  isSolid(x, y) {
    return BLOCK_META[this.get(x, y)]?.solid ?? false;
  }

  surfaceAt(x) {
    for (let y = 0; y < this.height; y++) {
      if (this.isSolid(x, y)) return y;
    }
    return this.height - 1;
  }

  generate() {
    const { width, height, seed } = this;
    const base = Math.floor(height * 0.42);

    for (let x = 0; x < width; x++) {
      const n = fbm(x * 0.035, seed);
      const hill = Math.floor((n - 0.5) * 22);
      const ground = Math.max(12, Math.min(height - 18, base + hill));

      const desert = fbm(x * 0.01, seed + 99) > 0.68;

      for (let y = 0; y < height; y++) {
        let id = BLOCK.AIR;
        if (y === height - 1) id = BLOCK.BEDROCK;
        else if (y > ground) {
          const depth = y - ground;
          if (desert && depth < 5) id = BLOCK.SAND;
          else if (depth === 1 && !desert) id = BLOCK.GRASS;
          else if (depth <= 4 && !desert) id = BLOCK.DIRT;
          else if (desert && depth <= 8) id = BLOCK.SAND;
          else id = BLOCK.STONE;

          // ores
          if (id === BLOCK.STONE && y > ground + 6) {
            const o = hash2(x * 31 + y * 17, seed + 7);
            if (o > 0.97 && y > height * 0.55) id = BLOCK.GOLD;
            else if (o > 0.93) id = BLOCK.IRON;
            else if (o > 0.88) id = BLOCK.COAL;
          }

          // caves
          if (y > ground + 3 && y < height - 3) {
            const cave = fbm(x * 0.08 + y * 0.11, seed + 55);
            const cave2 = fbm(x * 0.05 - y * 0.07, seed + 77);
            if (cave > 0.62 && cave2 > 0.55 && id !== BLOCK.BEDROCK) {
              id = BLOCK.AIR;
            }
          }
        }
        this.tiles[this.idx(x, y)] = id;
      }

      // trees
      if (!desert && this.get(x, ground) === BLOCK.GRASS) {
        const t = hash2(x, seed + 123);
        if (t > 0.86 && x > 3 && x < width - 3) {
          const trunkH = 3 + ((t * 10) | 0) % 3;
          for (let i = 1; i <= trunkH; i++) {
            if (ground - i >= 0) this.set(x, ground - i, BLOCK.WOOD);
          }
          const top = ground - trunkH;
          for (let dy = -2; dy <= 1; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              if (Math.abs(dx) + Math.abs(dy) > 3) continue;
              const lx = x + dx;
              const ly = top + dy;
              if (this.inBounds(lx, ly) && this.get(lx, ly) === BLOCK.AIR) {
                this.set(lx, ly, BLOCK.LEAVES);
              }
            }
          }
        }
      }
    }

    // starter flat zone near spawn
    const sx = Math.floor(width / 2);
    for (let x = sx - 4; x <= sx + 4; x++) {
      const s = this.surfaceAt(x);
      for (let y = 0; y < s; y++) {
        if (this.get(x, y) === BLOCK.LEAVES || this.get(x, y) === BLOCK.WOOD) {
          this.set(x, y, BLOCK.AIR);
        }
      }
    }
  }

  /** Spawn position in pixels (feet on ground) */
  spawnPoint() {
    const x = Math.floor(this.width / 2);
    const y = this.surfaceAt(x);
    return {
      x: x * this.tile + this.tile / 2,
      y: y * this.tile,
    };
  }
}

export { TILE };
