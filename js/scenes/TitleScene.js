import { CONFIG } from '../config.js';

export class TitleScene {
  constructor(game, params) {
    this.game = game;
    this.params = params;

    // アニメーション用
    this.time = 0;
    this.fadeAlpha = 0;
    this.showPrompt = false;
    this.glitchTimer = 0;
    this.glitchActive = false;
  }

  async enter() {
    // クリック/タップでゲーム開始
    this.clickHandler = () => {
      if (this.showPrompt) {
        this.game.scenes.change('intro');
      }
    };

    this.game.canvas.addEventListener('click', this.clickHandler);

    // フェードイン開始（少し遅延）
    setTimeout(() => {
      this.showPrompt = true;
    }, 2000);
  }

  async exit() {
    this.game.canvas.removeEventListener('click', this.clickHandler);
  }

  update(dt) {
    this.time += dt;

    // フェードイン
    if (this.fadeAlpha < 1) {
      this.fadeAlpha = Math.min(1, this.fadeAlpha + dt * 0.5);
    }

    // グリッチエフェクト
    this.glitchTimer += dt;
    if (this.glitchTimer > 3 + Math.random() * 2) {
      this.glitchActive = true;
      this.glitchTimer = 0;
      setTimeout(() => {
        this.glitchActive = false;
      }, 100 + Math.random() * 100);
    }
  }

  render(ctx) {
    const { CANVAS_WIDTH: W, CANVAS_HEIGHT: H } = CONFIG;

    // 背景
    ctx.fillStyle = '#050a0f';
    ctx.fillRect(0, 0, W, H);

    // グリッド描画
    this.renderGrid(ctx, W, H);

    // データストリーム
    this.renderDataStream(ctx, W, H);

    // スキャンライン効果
    this.renderScanlines(ctx, W, H);

    ctx.globalAlpha = this.fadeAlpha;

    // グリッチオフセット
    const glitchX = this.glitchActive ? (Math.random() - 0.5) * 10 : 0;
    const glitchY = this.glitchActive ? (Math.random() - 0.5) * 5 : 0;

    // メインタイトル「ORACLE」
    ctx.save();
    ctx.translate(glitchX, glitchY);

    // タイトルグロー
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#0ff';
    ctx.font = 'bold 96px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ORACLE', W / 2, H / 2 - 80);

    // グリッチ時の色ずれ
    if (this.glitchActive) {
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = '#f0f';
      ctx.fillText('ORACLE', W / 2 - 3, H / 2 - 80);
      ctx.fillStyle = '#ff0';
      ctx.fillText('ORACLE', W / 2 + 3, H / 2 - 80);
      ctx.globalAlpha = this.fadeAlpha;
    }

    ctx.restore();

    // サブタイトル
    ctx.shadowColor = '#0aa';
    ctx.shadowBlur = 10;
    ctx.font = '18px "Courier New", monospace';
    ctx.fillStyle = '#0aa';
    ctx.fillText('Observation Records And Consultation Logic Engine', W / 2, H / 2 - 10);

    // バージョン表記
    ctx.shadowBlur = 0;
    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = '#066';
    ctx.fillText('v2.5.1 // ADVISOR INTERFACE', W / 2, H / 2 + 30);

    // スタートプロンプト
    if (this.showPrompt) {
      const blink = Math.sin(this.time * 4) > 0;
      if (blink) {
        ctx.font = '20px "Courier New", monospace';
        ctx.fillStyle = '#0ff';
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 15;
        ctx.fillText('[ CLICK TO INITIALIZE ]', W / 2, H / 2 + 150);
      }
    }

    // ステータス表示
    ctx.shadowBlur = 0;
    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = '#064';
    ctx.textAlign = 'left';
    ctx.fillText(`SYS_TIME: ${new Date().toISOString()}`, 20, H - 40);
    ctx.fillText(`STATUS: AWAITING_ADVISOR`, 20, H - 20);

    ctx.textAlign = 'right';
    ctx.fillText(`CASES_PENDING: 1`, W - 20, H - 40);
    ctx.fillText(`PRIORITY: HIGH`, W - 20, H - 20);

    ctx.globalAlpha = 1;
  }

  renderGrid(ctx, W, H) {
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.03)';
    ctx.lineWidth = 1;

    // 縦線
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }

    // 横線
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  }

  renderDataStream(ctx, W, H) {
    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';

    const chars = '01アイウエオカキクケコ';
    for (let i = 0; i < 15; i++) {
      const x = (i * 87 + this.time * 20) % W;
      const speed = 0.5 + (i % 3) * 0.3;

      for (let j = 0; j < 20; j++) {
        const y = (j * 40 + this.time * 50 * speed) % H;
        const char = chars[Math.floor(Math.random() * chars.length)];
        const alpha = 0.03 + Math.sin(this.time + i + j) * 0.02;
        ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
        ctx.fillText(char, x, y);
      }
    }
  }

  renderScanlines(ctx, W, H) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let y = 0; y < H; y += 4) {
      ctx.fillRect(0, y, W, 2);
    }
  }
}
