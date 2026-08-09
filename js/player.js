import { BLOCK, BLOCK_META } from "./blocks.js";

export class Player {
  constructor(world) {
    this.world = world;
    const spawn = world.spawnPoint();
    this.w = 20;
    this.h = 28;
    this.x = spawn.x - this.w / 2;
    this.y = spawn.y - this.h - 2;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.facing = 1;
    this.speed = 160;
    this.jumpSpeed = 340;
    this.gravity = 980;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.anim = 0;
  }

  aabb() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  center() {
    return { x: this.x + this.w / 2, y: this.y + this.h / 2 };
  }

  update(dt, input) {
    this.anim += dt;
    if (input.left) {
      this.vx = -this.speed;
      this.facing = -1;
    } else if (input.right) {
      this.vx = this.speed;
      this.facing = 1;
    } else {
      this.vx *= Math.pow(0.001, dt);
      if (Math.abs(this.vx) < 4) this.vx = 0;
    }

    if (input.jumpPressed) this.jumpBuffer = 0.12;
    else this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);

    if (this.onGround) this.coyote = 0.09;
    else this.coyote = Math.max(0, this.coyote - dt);

    if (this.jumpBuffer > 0 && this.coyote > 0) {
      this.vy = -this.jumpSpeed;
      this.onGround = false;
      this.coyote = 0;
      this.jumpBuffer = 0;
    }

    // variable jump height
    if (!input.jump && this.vy < -80) {
      this.vy *= 0.55;
    }

    this.vy += this.gravity * dt;
    if (this.vy > 720) this.vy = 720;

    this.moveAxis(this.vx * dt, 0);
    this.moveAxis(0, this.vy * dt);

    // keep in world
    const maxX = this.world.width * this.world.tile - this.w;
    this.x = Math.max(0, Math.min(maxX, this.x));
    if (this.y > this.world.height * this.world.tile + 200) {
      const spawn = this.world.spawnPoint();
      this.x = spawn.x - this.w / 2;
      this.y = spawn.y - this.h - 2;
      this.vx = 0;
      this.vy = 0;
    }
  }

  moveAxis(dx, dy) {
    this.x += dx;
    this.y += dy;
    const tile = this.world.tile;
    const left = Math.floor(this.x / tile);
    const right = Math.floor((this.x + this.w - 0.01) / tile);
    const top = Math.floor(this.y / tile);
    const bottom = Math.floor((this.y + this.h - 0.01) / tile);

    this.onGround = false;

    for (let ty = top; ty <= bottom; ty++) {
      for (let tx = left; tx <= right; tx++) {
        if (!this.world.isSolid(tx, ty)) continue;
        const bx = tx * tile;
        const by = ty * tile;

        if (dx > 0) {
          this.x = bx - this.w;
          this.vx = 0;
        } else if (dx < 0) {
          this.x = bx + tile;
          this.vx = 0;
        }

        if (dy > 0) {
          this.y = by - this.h;
          this.vy = 0;
          this.onGround = true;
        } else if (dy < 0) {
          this.y = by + tile;
          this.vy = 0;
        }
      }
    }
  }

  draw(ctx, cam) {
    const x = Math.round(this.x - cam.x);
    const y = Math.round(this.y - cam.y);
    const bob = this.onGround && Math.abs(this.vx) > 20
      ? Math.sin(this.anim * 14) * 1.5
      : 0;

    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(x + this.w / 2, y + this.h + 2, this.w * 0.4, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // body (Steve-ish)
    ctx.fillStyle = "#3d6fb5";
    ctx.fillRect(x + 4, y + 12 + bob, 12, 10);

    // head
    ctx.fillStyle = "#c68642";
    ctx.fillRect(x + 3, y + bob, 14, 12);
    ctx.fillStyle = "#2b1d12";
    ctx.fillRect(x + 3, y + bob, 14, 3);

    // eyes
    ctx.fillStyle = "#fff";
    const eyeX = this.facing > 0 ? x + 10 : x + 4;
    ctx.fillRect(eyeX, y + 5 + bob, 3, 3);
    ctx.fillStyle = "#222";
    ctx.fillRect(eyeX + (this.facing > 0 ? 1 : 0), y + 6 + bob, 2, 2);

    // legs
    ctx.fillStyle = "#2f3f8f";
    const stride = this.onGround && Math.abs(this.vx) > 20
      ? Math.sin(this.anim * 14) * 3
      : 0;
    ctx.fillRect(x + 4, y + 22 + bob, 5, 6 + stride);
    ctx.fillRect(x + 11, y + 22 + bob, 5, 6 - stride);

    // arms
    ctx.fillStyle = "#c68642";
    ctx.fillRect(x + (this.facing > 0 ? 16 : 0), y + 13 + bob, 4, 9);
  }
}

export class Inventory {
  constructor() {
    this.counts = {};
    // starter blocks so players can build immediately
    this.add(BLOCK.DIRT, 24);
    this.add(BLOCK.PLANKS, 16);
    this.add(BLOCK.STONE, 8);
    this.selected = 0;
    this.slots = [
      BLOCK.DIRT,
      BLOCK.PLANKS,
      BLOCK.STONE,
      BLOCK.BRICK,
      BLOCK.WOOD,
      BLOCK.SAND,
      BLOCK.COAL,
      BLOCK.IRON,
    ];
  }

  add(id, n = 1) {
    if (!id) return;
    this.counts[id] = (this.counts[id] || 0) + n;
  }

  has(id, n = 1) {
    return (this.counts[id] || 0) >= n;
  }

  take(id, n = 1) {
    if (!this.has(id, n)) return false;
    this.counts[id] -= n;
    return true;
  }

  selectedId() {
    return this.slots[this.selected];
  }
}

export class Interaction {
  constructor(world, player, inventory) {
    this.world = world;
    this.player = player;
    this.inventory = inventory;
    this.mode = "mine"; // mine | build
    this.target = null;
    this.breakProgress = 0;
    this.breakId = null;
    this.particles = [];
    this.reach = 5.5;
  }

  toggleMode() {
    this.mode = this.mode === "mine" ? "build" : "mine";
    this.breakProgress = 0;
    this.breakId = null;
  }

  setTargetFromScreen(sx, sy, cam) {
    const tile = this.world.tile;
    const wx = sx + cam.x;
    const wy = sy + cam.y;
    const tx = Math.floor(wx / tile);
    const ty = Math.floor(wy / tile);
    const c = this.player.center();
    const dx = (tx + 0.5) * tile - c.x;
    const dy = (ty + 0.5) * tile - c.y;
    const dist = Math.hypot(dx, dy) / tile;
    if (dist > this.reach) {
      this.target = null;
      return;
    }
    this.target = { tx, ty, dist };
  }

  clearTarget() {
    this.target = null;
    this.breakProgress = 0;
    this.breakId = null;
  }

  update(dt, holding, tapBurst = false) {
    // particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vy += 600 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    if (!holding || !this.target) {
      if (!holding) {
        this.breakProgress = 0;
        this.breakId = null;
      }
      return;
    }

    if (this.mode !== "mine") return;

    const { tx, ty } = this.target;
    const id = this.world.get(tx, ty);
    const meta = BLOCK_META[id];
    if (!meta?.breakable) {
      this.breakProgress = 0;
      return;
    }
    const key = `${tx},${ty},${id}`;
    if (this.breakId !== key) {
      this.breakId = key;
      this.breakProgress = 0;
    }
    // Soft blocks break quickly; tap applies a burst so short presses still chip
    const rate = dt / Math.max(0.1, meta.hardness * 0.55);
    this.breakProgress += rate + (tapBurst ? 0.45 : 0);
    if (this.breakProgress >= 1) {
      this.world.set(tx, ty, BLOCK.AIR);
      if (meta.drops) this.inventory.add(meta.drops, 1);
      this.spawnBreakParticles(tx, ty, id);
      this.breakProgress = 0;
      this.breakId = null;
    }
  }

  tryPlace() {
    if (this.mode !== "build" || !this.target) return false;
    const { tx, ty } = this.target;
    const id = this.inventory.selectedId();
    if (!this.inventory.has(id)) return false;
    if (this.world.get(tx, ty) !== BLOCK.AIR) return false;
    if (this.overlapsPlayer(tx, ty)) return false;
    if (this.inventory.take(id, 1)) {
      this.world.set(tx, ty, id);
      return true;
    }
    return false;
  }

  overlapsPlayer(tx, ty) {
    const tile = this.world.tile;
    const p = this.player.aabb();
    const bx = tx * tile;
    const by = ty * tile;
    return !(p.x + p.w <= bx || p.x >= bx + tile || p.y + p.h <= by || p.y >= by + tile);
  }

  spawnBreakParticles(tx, ty, id) {
    const tile = this.world.tile;
    const colors = {
      [BLOCK.GRASS]: "#5aad3a",
      [BLOCK.DIRT]: "#8b5a2b",
      [BLOCK.STONE]: "#8a8a8a",
      [BLOCK.WOOD]: "#6b4423",
      [BLOCK.LEAVES]: "#3d8c34",
      [BLOCK.SAND]: "#e0c878",
      [BLOCK.COAL]: "#2e2e2e",
      [BLOCK.IRON]: "#c0c0c0",
      [BLOCK.GOLD]: "#e0b820",
      [BLOCK.PLANKS]: "#c49a4a",
      [BLOCK.BRICK]: "#a84a3a",
    };
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: tx * tile + tile / 2,
        y: ty * tile + tile / 2,
        vx: (Math.random() - 0.5) * 120,
        vy: -Math.random() * 140 - 20,
        life: 0.35 + Math.random() * 0.25,
        color: colors[id] || "#888",
        size: 3 + Math.random() * 3,
      });
    }
  }

  draw(ctx, cam) {
    const tile = this.world.tile;
    if (this.target) {
      const { tx, ty } = this.target;
      const x = tx * tile - cam.x;
      const y = ty * tile - cam.y;
      ctx.save();
      ctx.strokeStyle = this.mode === "mine" ? "rgba(255,255,255,0.85)" : "rgba(240,200,80,0.9)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, tile - 2, tile - 2);

      if (this.mode === "mine" && this.breakProgress > 0) {
        const cracks = Math.min(4, Math.floor(this.breakProgress * 5));
        ctx.strokeStyle = `rgba(20,20,20,${0.35 + this.breakProgress * 0.5})`;
        ctx.beginPath();
        for (let i = 0; i < cracks; i++) {
          ctx.moveTo(x + 6 + i * 5, y + 4);
          ctx.lineTo(x + 10 + i * 4, y + tile - 4);
          ctx.moveTo(x + 4, y + 8 + i * 5);
          ctx.lineTo(x + tile - 4, y + 12 + i * 4);
        }
        ctx.stroke();
      }

      if (this.mode === "build" && this.world.get(tx, ty) === BLOCK.AIR) {
        ctx.fillStyle = "rgba(240,200,80,0.22)";
        ctx.fillRect(x, y, tile, tile);
      }
      ctx.restore();
    }

    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life * 2);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - cam.x, p.y - cam.y, p.size, p.size);
      ctx.globalAlpha = 1;
    }
  }
}
