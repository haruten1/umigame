import { CONFIG } from '../config.js';
import { STORY } from '../../data/story.js';

export class CaseStartScene {
  constructor(game, params) {
    this.game = game;
    this.params = params;

    this.fadeAlpha = 0;
    this.textAlpha = 0;
    this.time = 0;
    this.canProceed = false;
  }

  async enter() {
    this.clickHandler = () => {
      if (this.canProceed) {
        this.game.scenes.change('story');
      }
    };
    this.game.canvas.addEventListener('click', this.clickHandler);
  }

  async exit() {
    this.game.canvas.removeEventListener('click', this.clickHandler);
  }

  update(dt) {
    this.time += dt;

    // 背景フェードイン
    if (this.fadeAlpha < 1) {
      this.fadeAlpha = Math.min(1, this.fadeAlpha + dt * 2);
    }

    // テキストはゆっくりフェードイン（0.5秒後から開始）
    if (this.time > 0.5 && this.textAlpha < 1) {
      this.textAlpha = Math.min(1, this.textAlpha + dt * 0.8);
    }

    // 2秒後からクリック可能
    if (this.time > 2) {
      this.canProceed = true;
    }
  }

  render(ctx) {
    const { CANVAS_WIDTH: W, CANVAS_HEIGHT: H } = CONFIG;

    // 背景
    ctx.fillStyle = '#050a0f';
    ctx.fillRect(0, 0, W, H);

    // グリッド
    this.renderGrid(ctx, W, H);
    this.renderScanlines(ctx, W, H);

    ctx.globalAlpha = this.fadeAlpha;

    // ケース番号（大きく）
    ctx.globalAlpha = this.textAlpha;
    ctx.fillStyle = '#0aa';
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Case ${STORY.caseNumber}`, W / 2, H / 2 - 40);

    // ケースタイトル（もっと大きく）
    ctx.fillStyle = '#0ff';
    ctx.font = 'bold 48px "Courier New", monospace';
    ctx.fillText(STORY.caseTitle, W / 2, H / 2 + 30);

    // 装飾ライン
    const lineWidth = 300;
    ctx.strokeStyle = '#0aa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - lineWidth / 2, H / 2 - 60);
    ctx.lineTo(W / 2 + lineWidth / 2, H / 2 - 60);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W / 2 - lineWidth / 2, H / 2 + 60);
    ctx.lineTo(W / 2 + lineWidth / 2, H / 2 + 60);
    ctx.stroke();

    // 進行プロンプト
    if (this.canProceed) {
      const blink = Math.sin(this.time * 4) > 0;
      if (blink) {
        ctx.fillStyle = '#0aa';
        ctx.font = '14px "Courier New", monospace';
        ctx.fillText('[ CLICK TO START ]', W / 2, H - 80);
      }
    }

    ctx.globalAlpha = 1;
  }

  renderGrid(ctx, W, H) {
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  }

  renderScanlines(ctx, W, H) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let y = 0; y < H; y += 4) {
      ctx.fillRect(0, y, W, 2);
    }
  }
}
