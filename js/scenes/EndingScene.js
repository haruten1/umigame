import { CONFIG } from '../config.js';
import { STORY } from '../../data/story.js';

export class EndingScene {
  constructor(game, params) {
    this.game = game;
    this.params = params;
    this.result = params.result || { score: 0, feedback: '', truth: '' };
    this.questionCount = params.questionCount || 0;
    this.playerVerdict = params.playerVerdict || '';

    this.phase = 'score';
    this.fadeAlpha = 0;
    this.displayScore = 0;
    this.scoreAnimDone = false;
    this.time = 0;

    this.endingDialogues = this.getEndingDialogues();
    this.currentDialogueIndex = 0;
    this.displayedText = '';
    this.charIndex = 0;
    this.textTimer = 0;

    // ORACLE登場フェードイン
    this.oracleFadeIn = 0;
  }

  getEndingDialogues() {
    const score = this.result.score;
    if (score >= 90) return STORY.endings.perfect;
    if (score >= 60) return STORY.endings.good;
    return STORY.endings.bad;
  }

  async enter() {
    this.clickHandler = () => {
      if (this.phase === 'score' && this.scoreAnimDone) {
        // 80%以下は質問フェーズに戻す
        if (this.result.score <= 80) {
          this.game.scenes.change('question');
          return;
        }
        this.phase = 'truth';
      } else if (this.phase === 'truth') {
        this.phase = 'ending';
        this.displayedText = '';
        this.charIndex = 0;
      } else if (this.phase === 'ending') {
        if (this.charIndex < this.endingDialogues[this.currentDialogueIndex]?.text.length) {
          this.displayedText = this.endingDialogues[this.currentDialogueIndex].text;
          this.charIndex = this.displayedText.length;
        } else {
          this.currentDialogueIndex++;
          if (this.currentDialogueIndex >= this.endingDialogues.length) {
            this.game.scenes.change('title');
          } else {
            this.displayedText = '';
            this.charIndex = 0;
          }
        }
      }
    };
    this.game.canvas.addEventListener('click', this.clickHandler);
  }

  async exit() {
    this.game.canvas.removeEventListener('click', this.clickHandler);
  }

  update(dt) {
    this.time += dt;

    if (this.fadeAlpha < 1) {
      this.fadeAlpha = Math.min(1, this.fadeAlpha + dt * 2);
    }

    if (this.phase === 'score' && !this.scoreAnimDone) {
      this.displayScore += dt * 80;
      if (this.displayScore >= this.result.score) {
        this.displayScore = this.result.score;
        this.scoreAnimDone = true;
      }
    }

    if (this.phase === 'ending' && this.currentDialogueIndex < this.endingDialogues.length) {
      const current = this.endingDialogues[this.currentDialogueIndex];
      this.textTimer += dt;
      while (this.textTimer >= 0.03 && this.charIndex < current.text.length) {
        this.textTimer -= 0.03;
        this.charIndex++;
        this.displayedText = current.text.slice(0, this.charIndex);
      }
    }

    // ORACLEのフェードイン（ORACLEが話している時のみ）
    if (this.phase === 'ending' && this.currentDialogueIndex < this.endingDialogues.length) {
      const currentDialogue = this.endingDialogues[this.currentDialogueIndex];
      if (currentDialogue && currentDialogue.speaker === 'ORACLE' && this.oracleFadeIn < 1) {
        this.oracleFadeIn = Math.min(1, this.oracleFadeIn + dt * 0.5);
      }
    }
  }

  render(ctx) {
    const { CANVAS_WIDTH: W, CANVAS_HEIGHT: H } = CONFIG;

    ctx.fillStyle = '#050a0f';
    ctx.fillRect(0, 0, W, H);

    this.renderGrid(ctx, W, H);
    this.renderScanlines(ctx, W, H);

    ctx.globalAlpha = this.fadeAlpha;

    if (this.phase === 'score') {
      this.renderScorePhase(ctx, W, H);
    } else if (this.phase === 'truth') {
      this.renderTruthPhase(ctx, W, H);
    } else if (this.phase === 'ending') {
      this.renderEndingPhase(ctx, W, H);
    }

    ctx.globalAlpha = 1;
  }

  renderScorePhase(ctx, W, H) {
    // ヘッダー
    ctx.fillStyle = '#0aa';
    ctx.font = '14px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('ORACLE://RESULT/ANALYSIS_EVALUATION', 20, 30);

    // 結果ウィンドウ
    const boxX = 200;
    const boxY = 150;
    const boxW = W - 400;
    const boxH = 350;

    ctx.fillStyle = 'rgba(5, 15, 25, 0.95)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#0aa';
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // ヘッダー
    ctx.fillStyle = '#0aa';
    ctx.fillRect(boxX, boxY, boxW, 25);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('  EVALUATION RESULT', boxX + 5, boxY + 17);

    // スコア表示
    ctx.textAlign = 'center';
    ctx.fillStyle = '#066';
    ctx.font = '16px "Courier New", monospace';
    ctx.fillText('ACCURACY_SCORE:', W / 2, boxY + 70);

    const scoreColor = this.result.score >= 90 ? '#0f0' :
      this.result.score >= 60 ? '#0aa' : '#f44';
    ctx.fillStyle = scoreColor;
    ctx.shadowColor = scoreColor;
    ctx.shadowBlur = 20;
    ctx.font = 'bold 96px "Courier New", monospace';
    ctx.fillText(Math.floor(this.displayScore), W / 2, boxY + 180);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#066';
    ctx.font = '24px "Courier New", monospace';
    ctx.fillText('%', W / 2 + 80, boxY + 180);

    // フィードバック
    if (this.scoreAnimDone) {
      ctx.fillStyle = '#0aa';
      ctx.font = '16px "Courier New", monospace';
      this.wrapText(ctx, this.result.feedback, W / 2, boxY + 240, boxW - 60, 24, 'center');

      const blink = Math.sin(this.time * 4) > 0;
      if (blink) {
        ctx.font = '14px "Courier New", monospace';
        if (this.result.score <= 80) {
          ctx.fillStyle = '#f80';
          ctx.fillText('[ CLICK TO RETRY INTERROGATION ]', W / 2, boxY + boxH - 30);
        } else {
          ctx.fillStyle = '#0f0';
          ctx.fillText('[ CLICK TO VIEW CONCLUSION ]', W / 2, boxY + boxH - 30);
        }
      }
    }
  }

  renderTruthPhase(ctx, W, H) {
    ctx.fillStyle = '#0aa';
    ctx.font = '14px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('ORACLE://RESULT/ANALYSIS_CONCLUSION', 20, 30);

    // 真相ウィンドウ
    const boxX = 80;
    const boxY = 60;
    const boxW = W - 160;
    const boxH = 520;

    ctx.fillStyle = 'rgba(5, 15, 25, 0.95)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#0a8';
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = '#0a8';
    ctx.fillRect(boxX, boxY, boxW, 40);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('  ANALYSIS CONCLUSION', boxX + 5, boxY + 27);

    // 導入文
    ctx.fillStyle = '#0aa';
    ctx.font = '16px "Courier New", monospace';
    ctx.fillText('あなたの分析をもとに、確からしい事実が判明しました。', boxX + 30, boxY + 70);

    ctx.fillStyle = '#0ff';
    ctx.font = '18px "Courier New", monospace';
    this.wrapText(ctx, this.result.truth, boxX + 30, boxY + 110, boxW - 60, 32, 'left');

    const blink = Math.sin(this.time * 4) > 0;
    if (blink) {
      ctx.fillStyle = '#a0a';
      ctx.font = '14px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ CLICK TO CONTINUE ]', W / 2, H - 40);
    }
  }

  renderEndingPhase(ctx, W, H) {
    if (this.currentDialogueIndex >= this.endingDialogues.length) return;

    const current = this.endingDialogues[this.currentDialogueIndex];

    // ヘッダー
    ctx.fillStyle = '#0aa';
    ctx.font = '14px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('ORACLE://TRANSMISSION/FINAL_MESSAGE', 20, 30);

    // メッセージウィンドウ
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

    ctx.fillStyle = 'rgba(5, 15, 25, 0.95)';
    ctx.fillRect(60, boxY, W - 120, boxH);
    ctx.strokeStyle = '#0aa';
    ctx.lineWidth = 1;
    ctx.strokeRect(60, boxY, W - 120, boxH);

    // ヘッダー
    ctx.fillStyle = '#0aa';
    ctx.fillRect(60, boxY, W - 120, 40);
    ctx.fillStyle = '#050a0f';
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`  ${current.speaker || 'ORACLE'}`, 65, boxY + 30);

    // プロンプト
    ctx.fillStyle = '#0a0';
    ctx.font = '20px "Courier New", monospace';
    ctx.fillText('>', 80, boxY + 75);

    // テキスト
    ctx.fillStyle = '#0ff';
    this.wrapText(ctx, this.displayedText, 100, boxY + 75, W - 200, 28, 'left');

    // 続行プロンプト
    if (this.charIndex >= (this.endingDialogues[this.currentDialogueIndex]?.text.length || 0)) {
      const blink = Math.sin(this.time * 4) > 0;
      if (blink) {
        ctx.fillStyle = '#0aa';
        ctx.font = '14px "Courier New", monospace';
        ctx.textAlign = 'right';
        ctx.fillText('[ CLICK TO CONTINUE ]', W - 80, boxY + boxH - 15);
      }
    }
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight, align = 'left') {
    ctx.textAlign = align;
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
