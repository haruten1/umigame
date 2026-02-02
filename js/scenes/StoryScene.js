import { CONFIG } from '../config.js';
import { STORY } from '../../data/story.js';

export class StoryScene {
  constructor(game, params) {
    this.game = game;
    this.params = params;

    // 段落配列
    this.paragraphs = STORY.puzzle.situation;
    this.currentParagraphIndex = 0;
    this.displayedParagraphs = []; // 表示済み段落
    this.displayedText = '';
    this.charIndex = 0;
    this.textSpeed = 0.02;
    this.timer = 0;
    this.isTextComplete = false;
    this.allParagraphsShown = false;
    this.canProceed = false;

    this.fadeAlpha = 0;
    this.time = 0;
  }

  async enter() {
    this.clickHandler = () => {
      if (this.canProceed) {
        this.game.scenes.change('question');
      } else if (this.allParagraphsShown && this.isTextComplete) {
        this.canProceed = true;
      } else if (this.isTextComplete) {
        this.nextParagraph();
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
    const currentParagraph = this.paragraphs[this.currentParagraphIndex];
    this.displayedText = currentParagraph;
    this.charIndex = currentParagraph.length;
    this.isTextComplete = true;
  }

  nextParagraph() {
    // 現在の段落を履歴に追加
    this.displayedParagraphs.push(this.paragraphs[this.currentParagraphIndex]);
    this.currentParagraphIndex++;

    if (this.currentParagraphIndex >= this.paragraphs.length) {
      this.allParagraphsShown = true;
    } else {
      // 次の段落へ
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

    if (!this.isTextComplete && this.currentParagraphIndex < this.paragraphs.length) {
      this.timer += dt;
      const currentParagraph = this.paragraphs[this.currentParagraphIndex];
      while (this.timer >= this.textSpeed && this.charIndex < currentParagraph.length) {
        this.timer -= this.textSpeed;
        this.charIndex++;
        this.displayedText = currentParagraph.slice(0, this.charIndex);
      }
      if (this.charIndex >= currentParagraph.length) {
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
    this.renderScanlines(ctx, W, H);

    ctx.globalAlpha = this.fadeAlpha;

    // ケースタイトル（上部に常時表示）
    ctx.fillStyle = '#0aa';
    ctx.font = '16px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Case ${STORY.caseNumber}`, W / 2, 35);
    ctx.fillStyle = '#0ff';
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.fillText(STORY.caseTitle, W / 2, 70);

    // データウィンドウ
    const boxX = 80;
    const boxY = 100;
    const boxW = W - 160;
    const boxH = 400;

    // ウィンドウ背景
    ctx.fillStyle = 'rgba(5, 15, 25, 0.95)';
    ctx.fillRect(boxX, boxY, boxW, boxH);

    // 枠線
    ctx.strokeStyle = '#0aa';
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // 問題文表示
    ctx.font = '18px "Courier New", monospace';
    ctx.textAlign = 'left';
    let currentY = boxY + 50;
    const lineHeight = 32;

    // 表示済み段落（薄く表示）
    ctx.fillStyle = 'rgba(0, 170, 170, 0.6)';
    for (const paragraph of this.displayedParagraphs) {
      currentY = this.wrapTextWithReturn(ctx, paragraph, boxX + 30, currentY, boxW - 60, lineHeight);
      currentY += lineHeight * 0.5; // 段落間のスペース
    }

    // 現在の段落（明るく表示）
    if (!this.allParagraphsShown) {
      ctx.fillStyle = '#0ff';
      this.wrapText(ctx, this.displayedText, boxX + 30, currentY, boxW - 60, lineHeight);
    }

    // カーソル点滅
    if (!this.isTextComplete && !this.allParagraphsShown) {
      const blink = Math.sin(this.time * 8) > 0;
      if (blink) {
        ctx.fillStyle = '#0ff';
        ctx.fillRect(boxX + 30, boxY + boxH - 60, 12, 20);
      }
    }

    // 相談役へのプロンプト（枠外）- 全段落表示後
    if (this.allParagraphsShown) {
      ctx.fillStyle = '#0aa';
      ctx.font = '16px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(STORY.puzzle.advisorPrompt, W / 2, boxY + boxH + 40);
    }

    // 進行プロンプト
    if (this.isTextComplete) {
      ctx.font = '14px "Courier New", monospace';
      ctx.textAlign = 'center';

      if (this.canProceed) {
        const blink = Math.sin(this.time * 4) > 0;
        if (blink) {
          ctx.fillStyle = '#0f0';
          ctx.fillText('[ CLICK TO BEGIN TRACE INTERROGATION ]', W / 2, H - 40);
        }
      } else if (this.allParagraphsShown) {
        ctx.fillStyle = '#0aa';
        ctx.fillText('[ CLICK TO CONFIRM ]', W / 2, H - 40);
      } else {
        const blink = Math.sin(this.time * 4) > 0;
        if (blink) {
          ctx.fillStyle = '#0aa';
          ctx.fillText('[ CLICK TO CONTINUE ]', W / 2, H - 40);
        }
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

  wrapTextWithReturn(ctx, text, x, y, maxWidth, lineHeight) {
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
    return currentY + lineHeight;
  }
}
