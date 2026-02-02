import { CONFIG } from './config.js';
import { SceneManager } from './scenes/SceneManager.js';
import { InputManager } from './engine/InputManager.js';
import { AudioManager } from './engine/AudioManager.js';

export class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.uiLayer = document.getElementById('ui-layer');

    // Canvas サイズ設定
    this.canvas.width = CONFIG.CANVAS_WIDTH;
    this.canvas.height = CONFIG.CANVAS_HEIGHT;

    // マネージャー初期化
    this.input = new InputManager(this.canvas, this.uiLayer);
    this.audio = new AudioManager();
    this.scenes = new SceneManager(this);

    // 画像リソース
    this.images = {};

    // ゲーム状態
    this.lastTime = 0;
    this.running = false;
  }

  loadImage(key, src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.images[key] = img;
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  async loadAssets() {
    await Promise.all([
      this.loadImage('oracle', 'assets/images/oracle.png'),
      this.loadImage('trace_woman', 'assets/images/町娘.png'),
    ]);
  }

  async start() {
    console.log('Game starting...');

    // アセット読み込み
    await this.loadAssets();

    // 初期シーン（タイトル）へ
    await this.scenes.change('title');

    // ゲームループ開始
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  loop(currentTime) {
    if (!this.running) return;

    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // 更新
    this.update(deltaTime);

    // 描画
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    this.scenes.update(dt);
  }

  render() {
    // 画面クリア
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // シーン描画
    this.scenes.render(this.ctx);
  }
}
