import { BLOCK, drawBlock, makeBlockIcon } from "./blocks.js";
import { World } from "./world.js";
import { Player, Inventory, Interaction } from "./player.js";
import { Input } from "./input.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const modeBadge = document.getElementById("mode-badge");
const hotbarEl = document.getElementById("hotbar");
const titleScreen = document.getElementById("title-screen");
const btnStart = document.getElementById("btn-start");
const btnMode = document.getElementById("btn-mode");

let world, player, inventory, interaction, input;
let running = false;
let last = 0;
let cam = { x: 0, y: 0 };
let clouds = [];
let screenShake = 0;
let lastCounts = "";

function dpr() {
  return Math.min(window.devicePixelRatio || 1, 2);
}

function resize() {
  const scale = dpr();
  canvas.width = Math.floor(window.innerWidth * scale);
  canvas.height = Math.floor(window.innerHeight * scale);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}

function initGame() {
  world = new World(220, 90);
  player = new Player(world);
  inventory = new Inventory();
  interaction = new Interaction(world, player, inventory);
  input = new Input(canvas);
  clouds = Array.from({ length: 10 }, () => ({
    x: Math.random() * world.width * world.tile,
    y: 40 + Math.random() * 160,
    w: 60 + Math.random() * 100,
    speed: 8 + Math.random() * 16,
  }));
  buildHotbar();
  updateModeUI();
  running = true;
  last = performance.now();
  requestAnimationFrame(loop);
}

function buildHotbar() {
  hotbarEl.innerHTML = "";
  inventory.slots.forEach((id, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "slot" + (i === inventory.selected ? " selected" : "");
    btn.dataset.index = String(i);
    btn.appendChild(makeBlockIcon(id, 28));
    const count = document.createElement("span");
    count.className = "count";
    count.textContent = String(inventory.counts[id] || 0);
    btn.appendChild(count);
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      inventory.selected = i;
      refreshHotbar();
    });
    hotbarEl.appendChild(btn);
  });
  lastCounts = JSON.stringify(inventory.counts);
}

function refreshHotbar() {
  [...hotbarEl.children].forEach((el, i) => {
    el.classList.toggle("selected", i === inventory.selected);
    const id = inventory.slots[i];
    const count = el.querySelector(".count");
    if (count) count.textContent = String(inventory.counts[id] || 0);
  });
  lastCounts = JSON.stringify(inventory.counts);
}

function maybeRefreshHotbar() {
  const key = JSON.stringify(inventory.counts);
  if (key !== lastCounts) refreshHotbar();
}

function updateModeUI() {
  const mine = interaction.mode === "mine";
  modeBadge.textContent = mine ? "MINE" : "BUILD";
  btnMode.textContent = mine ? "MINE" : "BUILD";
  btnMode.classList.toggle("build", !mine);
}

btnMode.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (!interaction) return;
  interaction.toggleMode();
  updateModeUI();
});

btnStart.addEventListener("click", () => {
  titleScreen.classList.add("hidden");
  initGame();
});

window.addEventListener("resize", resize);
resize();

function updateCamera(dt) {
  const viewW = window.innerWidth;
  const viewH = window.innerHeight;
  const targetX = player.x + player.w / 2 - viewW / 2;
  const targetY = player.y + player.h / 2 - viewH * 0.55;
  cam.x += (targetX - cam.x) * Math.min(1, 8 * dt);
  cam.y += (targetY - cam.y) * Math.min(1, 8 * dt);

  const maxX = world.width * world.tile - viewW;
  const maxY = world.height * world.tile - viewH;
  cam.x = Math.max(0, Math.min(Math.max(0, maxX), cam.x));
  cam.y = Math.max(0, Math.min(Math.max(0, maxY), cam.y));
}

function drawBackground() {
  const viewW = window.innerWidth;
  const viewH = window.innerHeight;

  const g = ctx.createLinearGradient(0, 0, 0, viewH);
  g.addColorStop(0, "#6eb7e8");
  g.addColorStop(0.52, "#b9dff5");
  g.addColorStop(0.52, "#7cb85a");
  g.addColorStop(1, "#3f6e2e");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, viewW, viewH);

  const sunX = viewW * 0.78 - cam.x * 0.02;
  const sunY = 70 - cam.y * 0.02;
  ctx.fillStyle = "#ffe28a";
  ctx.beginPath();
  ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,230,140,0.25)";
  ctx.beginPath();
  ctx.arc(sunX, sunY, 48, 0, Math.PI * 2);
  ctx.fill();

  for (const c of clouds) {
    const x = ((c.x - cam.x * 0.3) % (viewW + 220) + (viewW + 220)) % (viewW + 220) - 110;
    const y = c.y - cam.y * 0.1;
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    roundCloud(x, y, c.w);
  }

  ctx.fillStyle = "#5a9a48";
  ctx.beginPath();
  ctx.moveTo(0, viewH * 0.58);
  for (let x = 0; x <= viewW; x += 20) {
    const h =
      Math.sin((x + cam.x * 0.15) * 0.01) * 28 +
      Math.sin((x + cam.x * 0.1) * 0.023) * 16;
    ctx.lineTo(x, viewH * 0.55 - h);
  }
  ctx.lineTo(viewW, viewH);
  ctx.lineTo(0, viewH);
  ctx.fill();
}

function roundCloud(x, y, w) {
  ctx.beginPath();
  ctx.ellipse(x, y, w * 0.35, 14, 0, 0, Math.PI * 2);
  ctx.ellipse(x + w * 0.25, y - 6, w * 0.28, 16, 0, 0, Math.PI * 2);
  ctx.ellipse(x + w * 0.5, y, w * 0.32, 13, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawWorld() {
  const tile = world.tile;
  const viewW = window.innerWidth;
  const viewH = window.innerHeight;
  const x0 = Math.max(0, Math.floor(cam.x / tile) - 1);
  const y0 = Math.max(0, Math.floor(cam.y / tile) - 1);
  const x1 = Math.min(world.width - 1, Math.ceil((cam.x + viewW) / tile) + 1);
  const y1 = Math.min(world.height - 1, Math.ceil((cam.y + viewH) / tile) + 1);

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const id = world.get(x, y);
      if (id === BLOCK.AIR) continue;
      const sx = Math.floor(x * tile - cam.x);
      const sy = Math.floor(y * tile - cam.y);
      drawBlock(ctx, id, sx, sy, tile, x * 31 + y * 17);
    }
  }
}

function drawVignette() {
  const viewW = window.innerWidth;
  const viewH = window.innerHeight;
  const grd = ctx.createRadialGradient(
    viewW / 2,
    viewH / 2,
    viewH * 0.35,
    viewW / 2,
    viewH / 2,
    viewH * 0.85
  );
  grd.addColorStop(0, "rgba(0,0,0,0)");
  grd.addColorStop(1, "rgba(10,20,12,0.28)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, viewW, viewH);
}

function loop(now) {
  if (!running) return;
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  const edges = input.beginFrame();
  if (edges.modeToggle) {
    interaction.toggleMode();
    updateModeUI();
  }

  player.update(dt, input);

  if (edges.holdingWorld) {
    const sx = edges.tap?.x ?? input.pointerX;
    const sy = edges.tap?.y ?? input.pointerY;
    interaction.setTargetFromScreen(sx, sy, cam);
  } else {
    interaction.clearTarget();
  }

  if (edges.placeEdge) {
    if (interaction.mode === "build") {
      interaction.tryPlace();
    } else if (interaction.tryMine()) {
      screenShake = 0.1;
    }
  }

  const prevProgress = interaction.breakProgress;
  interaction.update(dt, edges.holdingWorld && interaction.mode === "mine");
  if (prevProgress > 0.5 && interaction.breakProgress === 0) {
    screenShake = 0.1;
  }

  maybeRefreshHotbar();

  for (const c of clouds) {
    c.x += c.speed * dt;
    if (c.x > world.width * world.tile + 100) c.x = -120;
  }

  updateCamera(dt);
  if (screenShake > 0) screenShake -= dt;

  ctx.save();
  if (screenShake > 0) {
    ctx.translate((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
  }
  drawBackground();
  drawWorld();
  interaction.draw(ctx, cam);
  player.draw(ctx, cam);
  drawVignette();
  ctx.restore();

  requestAnimationFrame(loop);
}

document.addEventListener("gesturestart", (e) => e.preventDefault());
document.addEventListener("dblclick", (e) => e.preventDefault());
