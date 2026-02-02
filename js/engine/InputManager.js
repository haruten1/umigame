export class InputManager {
  constructor(canvas, uiLayer) {
    this.canvas = canvas;
    this.uiLayer = uiLayer;

    // マウス/タッチ状態
    this.mouseX = 0;
    this.mouseY = 0;
    this.isPressed = false;
    this.justClicked = false;

    // イベント登録
    this.setupEvents();
  }

  setupEvents() {
    // マウス移動
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    });

    // クリック
    this.canvas.addEventListener('mousedown', () => {
      this.isPressed = true;
      this.justClicked = true;
    });

    this.canvas.addEventListener('mouseup', () => {
      this.isPressed = false;
    });

    // タッチ対応
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = touch.clientX - rect.left;
      this.mouseY = touch.clientY - rect.top;
      this.isPressed = true;
      this.justClicked = true;
    });

    this.canvas.addEventListener('touchend', () => {
      this.isPressed = false;
    });
  }

  // フレーム終了時に呼ぶ
  resetFrame() {
    this.justClicked = false;
  }

  // 矩形内にマウスがあるか
  isInRect(x, y, width, height) {
    return (
      this.mouseX >= x &&
      this.mouseX <= x + width &&
      this.mouseY >= y &&
      this.mouseY <= y + height
    );
  }
}
