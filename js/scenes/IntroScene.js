import { CONFIG } from '../config.js';
import { STORY } from '../../data/story.js';

export class IntroScene {
  constructor(game, params) {
    this.game = game;
    this.params = params;

    // ダイアログ状態
    this.dialogues = STORY.intro;
    this.currentIndex = 0;
    this.displayedText = '';
    this.charIndex = 0;
    this.textSpeed = 0.03;
    this.timer = 0;
    this.isTextComplete = false;

    // ログ履歴
    this.logHistory = [];

    // 演出用
    this.fadeAlpha = 0;
    this.time = 0;

    // ORACLE登場フェードイン
    this.oracleFadeIn = 0;
  }

  async enter() {
    this.clickHandler = () => {
      if (this.isTextComplete) {
        this.nextDialogue();
      } else {
        this.skipText();
      }
    };
    this.game.canvas.addEventListener('click', this.clickHandler);
  }

  async exit() {
    this.game.canvas.removeEventListener('click', this.clickHandler);
  }

  skipText() {
    const current = this.dialogues[this.currentIndex];
    this.displayedText = current.text;
    this.charIndex = current.text.length;
    this.isTextComplete = true;
  }

  nextDialogue() {
    // 現在のダイアログをログに追加
    const current = this.dialogues[this.currentIndex];
    this.logHistory.push({
      speaker: current.speaker,
      text: current.text,
    });

    this.currentIndex++;
    if (this.currentIndex >= this.dialogues.length) {
      this.game.scenes.change('caseStart');
    } else {
      this.displayedText = '';
      this.charIndex = 0;
      this.isTextComplete = false;
    }
  }

  update(dt) {
    this.time += dt;

    if (this.fadeAlpha < 1) {
      this.fadeAlpha = Math.min(1, this.fadeAlpha + dt * 2);
    }

    // ORACLEのフェードイン（ORACLEが話している時のみ）
    const current = this.dialogues[this.currentIndex];
    if (current && current.speaker === 'ORACLE' && this.oracleFadeIn < 1) {
      this.oracleFadeIn = Math.min(1, this.oracleFadeIn + dt * 0.5);
    }

    if (!this.isTextComplete && this.currentIndex < this.dialogues.length) {
      this.timer += dt;
      const current = this.dialogues[this.currentIndex];

      while (this.timer >= this.textSpeed && this.charIndex < current.text.length) {
        this.timer -= this.textSpeed;
        this.charIndex++;
        this.displayedText = current.text.slice(0, this.charIndex);
      }

      if (this.charIndex >= current.text.length) {
        this.isTextComplete = true;
      }
    }
  }

  render(ctx) {
    const { CANVAS_WIDTH: W, CANVAS_HEIGHT: H } = CONFIG;

    // 背景
    ctx.fillStyle = '#050a0f';
    ctx.fillRect(0, 0, W, H);

    // グリッド
    this.renderGrid(ctx, W, H);

    // スキャンライン
    this.renderScanlines(ctx, W, H);

    ctx.globalAlpha = this.fadeAlpha;

    // ヘッダー
    ctx.fillStyle = '#0aa';
    ctx.font = '14px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('ORACLE://INIT/ADVISOR_BRIEFING', 20, 30);

    // ログ履歴表示エリア
    this.renderLogHistory(ctx, W, H);

    // 現在のメッセージ（コンソールウィンドウ）
    if (this.currentIndex < this.dialogues.length) {
      const current = this.dialogues[this.currentIndex];
      this.renderConsoleWindow(ctx, current, W, H);
    }

    ctx.globalAlpha = 1;
  }

  renderLogHistory(ctx, W, H) {
    const startY = 60;
    const lineHeight = 24;
    const maxVisible = 8;

    ctx.font = '14px "Courier New", monospace';
    ctx.textAlign = 'left';

    const startIdx = Math.max(0, this.logHistory.length - maxVisible);
    let y = startY;

    for (let i = startIdx; i < this.logHistory.length; i++) {
      const log = this.logHistory[i];
      const alpha = 0.3 + (i - startIdx) * 0.05;
      ctx.fillStyle = `rgba(0, 170, 170, ${alpha})`;
      ctx.fillText(`[${log.speaker}] ${log.text.slice(0, 60)}${log.text.length > 60 ? '...' : ''}`, 30, y);
      y += lineHeight;
    }
  }

  renderConsoleWindow(ctx, current, W, H) {
    const boxY = H - 220;
    const boxH = 180;

    // ORACLE立ち絵を表示（speakerがORACLEの場合）
    if (current.speaker === 'ORACLE') {
      const oracleImg = this.game.images.oracle;
      if (oracleImg) {
        const imgHeight = 450;
        const imgWidth = (oracleImg.width / oracleImg.height) * imgHeight;
        const imgX = (W - imgWidth) / 2;
        // 浮遊アニメーション（ゆっくり）
        const floatOffset = Math.sin(this.time * 0.8) * 6;
        const imgY = boxY - imgHeight + 50 + floatOffset;

        // ホログラム風エフェクト（ゆっくり明滅）+ フェードイン
        const glowAlpha = 0.5 + Math.sin(this.time * 1) * 0.3;
        ctx.globalAlpha = glowAlpha * this.oracleFadeIn;
        ctx.drawImage(oracleImg, imgX, imgY, imgWidth, imgHeight);
        ctx.globalAlpha = 1;
      }
    }

    // コンソールウィンドウ背景
    ctx.fillStyle = 'rgba(5, 15, 25, 0.95)';
    ctx.fillRect(60, boxY, W - 120, boxH);

    // 枠線（シアン）
    ctx.strokeStyle = '#0aa';
    ctx.lineWidth = 1;
    ctx.strokeRect(60, boxY, W - 120, boxH);

    // ウィンドウヘッダー
    ctx.fillStyle = '#0aa';
    ctx.fillRect(60, boxY, W - 120, 40);
    ctx.fillStyle = '#050a0f';
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`  ${current.speaker || 'SYSTEM'}`, 65, boxY + 30);

    // メッセージ本文
    ctx.fillStyle = '#0ff';
    ctx.font = '20px "Courier New", monospace';
    const textY = boxY + 75;

    // プロンプト
    ctx.fillStyle = '#0a0';
    ctx.fillText('>', 80, textY);

    // テキスト
    ctx.fillStyle = '#0ff';
    this.wrapText(ctx, this.displayedText, 100, textY, W - 200, 28);

    // カーソル点滅
    if (!this.isTextComplete) {
      const blink = Math.sin(this.time * 8) > 0;
      if (blink) {
        const lastLineWidth = ctx.measureText(this.getLastLine(this.displayedText, W - 200)).width;
        ctx.fillStyle = '#0ff';
        ctx.fillRect(100 + lastLineWidth + 5, textY - 15, 10, 20);
      }
    }

    // 続行プロンプト
    if (this.isTextComplete) {
      const blink = Math.sin(this.time * 4) > 0;
      if (blink) {
        ctx.fillStyle = '#0aa';
        ctx.font = '14px "Courier New", monospace';
        ctx.textAlign = 'right';
        ctx.fillText('[ CLICK TO CONTINUE ]', W - 80, boxY + boxH - 15);
      }
    }
  }

  getLastLine(text, maxWidth) {
    const ctx = this.game.ctx;
    let line = '';
    for (const char of text) {
      const testLine = line + char;
      if (ctx.measureText(testLine).width > maxWidth) {
        line = char;
      } else {
        line = testLine;
      }
    }
    return line;
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

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    let line = '';
    let currentY = y;

    for (const char of text) {
      const testLine = line + char;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && line !== '') {
        ctx.fillText(line, x, currentY);
        line = char;
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }
}
