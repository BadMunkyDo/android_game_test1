/** Touch + keyboard input for mobile-first play */

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.left = false;
    this.right = false;
    this.jump = false;
    this.jumpPressed = false;
    this._jumpEdge = false;

    this.pointerDown = false;
    this.pointerX = 0;
    this.pointerY = 0;
    this.worldPointer = false; // true when interacting with world (not UI)
    this.placeEdge = false;

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

    const onDown = (e) => {
      if (e.target.closest(".ctrl") || e.target.closest(".slot") || e.target.closest("#title-screen")) {
        return;
      }
      this.pointerDown = true;
      this.worldPointer = true;
      this.updatePointer(e);
      this.placeEdge = true;
    };

    const onMove = (e) => {
      if (!this.pointerDown) return;
      this.updatePointer(e);
    };

    const onUp = () => {
      this.pointerDown = false;
      this.worldPointer = false;
    };

    this.canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    // virtual buttons
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
    };
    const end = (e) => {
      e.preventDefault();
      e.stopPropagation();
      el.classList.remove("active");
      this._uiTouch.delete(name);
    };
    el.addEventListener("pointerdown", start);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointerleave", end);
    el.addEventListener("pointercancel", end);
  }

  updatePointer(e) {
    const t = e.touches ? e.touches[0] : e;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    this.pointerX = (t.clientX - rect.left) * scaleX;
    this.pointerY = (t.clientY - rect.top) * scaleY;
  }

  beginFrame() {
    const left = this._keys.has("ArrowLeft") || this._keys.has("KeyA") || this._uiTouch.has("left");
    const right = this._keys.has("ArrowRight") || this._keys.has("KeyD") || this._uiTouch.has("right");
    const jump = this._keys.has("Space") || this._keys.has("ArrowUp") || this._keys.has("KeyW") || this._uiTouch.has("jump");

    this.jumpPressed = (!this.jump && jump) || this._jumpEdge;
    this._jumpEdge = false;
    this.left = left;
    this.right = right;
    this.jump = jump;

    const mode = this._modeToggle;
    this._modeToggle = false;

    const place = this.placeEdge;
    this.placeEdge = false;

    return { modeToggle: mode, placeEdge: place };
  }
}
