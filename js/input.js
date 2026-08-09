/** Touch + keyboard input for mobile-first play */

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.left = false;
    this.right = false;
    this.jump = false;
    this.jumpPressed = false;

    this.pointerX = 0;
    this.pointerY = 0;
    this.holdingWorld = false;
    this._pendingWorldTap = null; // {x,y} CSS-pixel canvas coords
    this._jumpEdge = false;
    this._modeToggle = false;

    this._keys = new Set();
    this._uiTouch = new Set();

    this.bind();
  }

  bind() {
    window.addEventListener("keydown", (e) => {
      this._keys.add(e.code);
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space", "KeyA", "KeyD", "KeyW"].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === "KeyF" || e.code === "KeyQ") {
        this._modeToggle = true;
      }
    }, { passive: false });

    window.addEventListener("keyup", (e) => {
      this._keys.delete(e.code);
    });

    const isUi = (t) =>
      t && (t.closest?.(".ctrl") || t.closest?.(".slot") || t.closest?.("#title-screen") || t.closest?.("#hotbar"));

    const onWorldDown = (e) => {
      if (isUi(e.target)) return;
      // Only treat as world interaction if the event is on the canvas/app playfield
      if (e.target !== this.canvas && !e.target.closest?.("#app")) return;
      if (e.target.closest?.("#controls")) return;

      this.updatePointer(e);
      this.holdingWorld = true;
      this._pendingWorldTap = { x: this.pointerX, y: this.pointerY };
      try {
        this.canvas.setPointerCapture?.(e.pointerId);
      } catch (_) { /* ignore */ }
    };

    const onWorldMove = (e) => {
      if (!this.holdingWorld) return;
      this.updatePointer(e);
    };

    const onWorldUp = (e) => {
      if (e && this.holdingWorld) {
        this.updatePointer(e);
      }
      this.holdingWorld = false;
    };

    this.canvas.addEventListener("pointerdown", onWorldDown);
    window.addEventListener("pointermove", onWorldMove);
    window.addEventListener("pointerup", onWorldUp);
    window.addEventListener("pointercancel", onWorldUp);

    this.bindButton(document.querySelector('[data-dir="left"]'), "left");
    this.bindButton(document.querySelector('[data-dir="right"]'), "right");
    this.bindButton(document.getElementById("btn-jump"), "jump");
  }

  bindButton(el, name) {
    if (!el) return;

    const start = (e) => {
      e.preventDefault();
      e.stopPropagation();
      el.classList.add("active");
      this._uiTouch.add(name);
      if (name === "jump") this._jumpEdge = true;
      // Keep move buttons held for a short time after a tap (helps quick clicks)
      if (name === "left" || name === "right") {
        clearTimeout(this._uiLatch?.[name]);
        this._uiLatch = this._uiLatch || {};
        this._uiLatch[name] = setTimeout(() => {
          if (!el.classList.contains("active")) this._uiTouch.delete(name);
        }, 140);
      }
      try {
        if (e.pointerId != null) el.setPointerCapture?.(e.pointerId);
      } catch (_) { /* ignore */ }
    };

    const end = (e) => {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      el.classList.remove("active");
      // Delay removal slightly so a single animation frame sees the press
      const release = () => this._uiTouch.delete(name);
      if (name === "jump") {
        setTimeout(release, 50);
      } else if (name === "left" || name === "right") {
        setTimeout(release, 120);
      } else {
        release();
      }
    };

    el.addEventListener("pointerdown", start);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("lostpointercapture", end);
  }

  updatePointer(e) {
    const t = e.touches?.[0] || e.changedTouches?.[0] || e;
    const rect = this.canvas.getBoundingClientRect();
    // Store in CSS pixels to match rendering space
    this.pointerX = t.clientX - rect.left;
    this.pointerY = t.clientY - rect.top;
  }

  beginFrame() {
    const left =
      this._keys.has("ArrowLeft") ||
      this._keys.has("KeyA") ||
      this._uiTouch.has("left");
    const right =
      this._keys.has("ArrowRight") ||
      this._keys.has("KeyD") ||
      this._uiTouch.has("right");
    const jumpHeld =
      this._keys.has("Space") ||
      this._keys.has("ArrowUp") ||
      this._keys.has("KeyW") ||
      this._uiTouch.has("jump");

    this.jumpPressed = (!this.jump && jumpHeld) || this._jumpEdge;
    this._jumpEdge = false;
    this.left = left;
    this.right = right;
    this.jump = jumpHeld;

    // Latch world tap for at least one frame (handles down+up before rAF)
    const tap = this._pendingWorldTap;
    this._pendingWorldTap = null;

    const mode = this._modeToggle;
    this._modeToggle = false;

    return {
      modeToggle: mode,
      placeEdge: !!tap,
      tap,
      holdingWorld: this.holdingWorld || !!tap,
    };
  }
}
