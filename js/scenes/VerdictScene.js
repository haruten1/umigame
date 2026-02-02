import { CONFIG } from '../config.js';
import { STORY } from '../../data/story.js';
import { judgeVerdict } from '../api/gemini.js';

export class VerdictScene {
  constructor(game, params) {
    this.game = game;
    this.params = params;
    this.conversationHistory = params.conversationHistory || [];
    this.questionCount = params.questionCount || 0;

    this.inputElement = null;
    this.charCount = 0;
    this.maxChars = CONFIG.VERDICT_MAX_LENGTH;

    this.isJudging = false;
    this.result = null;

    this.fadeAlpha = 0;
    this.time = 0;
  }

  async enter() {
    this.createInputElement();
  }

  async exit() {
    if (this.inputElement) this.inputElement.remove();
    if (this.submitButton) this.submitButton.remove();
  }

  createInputElement() {
    this.inputElement = document.createElement('textarea');
    this.inputElement.className = 'text-input';
    this.inputElement.placeholder = 'Enter your analysis of the case truth...';
    this.inputElement.style.left = '80px';
    this.inputElement.style.top = '280px';
    this.inputElement.style.width = '1120px';
    this.inputElement.style.height = '180px';
    this.inputElement.maxLength = this.maxChars;
    this.inputElement.oninput = () => {
      this.charCount = this.inputElement.value.length;
    };
    this.game.uiLayer.appendChild(this.inputElement);

    this.submitButton = document.createElement('button');
    this.submitButton.className = 'game-button';
    this.submitButton.textContent = 'SUBMIT FINAL ANALYSIS';
    this.submitButton.style.left = '500px';
    this.submitButton.style.top = '500px';
    this.submitButton.style.background = 'linear-gradient(180deg, #0a3a2a, #051a15)';
    this.submitButton.style.borderColor = '#0a8';
    this.submitButton.style.color = '#0fa';
    this.submitButton.onclick = () => this.submitVerdict();
    this.game.uiLayer.appendChild(this.submitButton);
  }

  async submitVerdict() {
    const verdict = this.inputElement.value.trim();
    if (!verdict || this.isJudging) return;

    this.isJudging = true;
    this.submitButton.disabled = true;
    this.inputElement.disabled = true;

    try {
      const response = await judgeVerdict(
        STORY.puzzle,
        verdict
      );
      this.result = response;
    } catch (error) {
      console.error('API Error:', error);
      this.result = {
        score: 0,
        feedback: 'ERROR: Analysis processing failed',
        truth: STORY.puzzle.truth,
      };
    }

    setTimeout(() => {
      this.game.scenes.change('ending', {
        result: this.result,
        questionCount: this.questionCount,
        playerVerdict: verdict,
      });
    }, 2000);
  }

  update(dt) {
    this.time += dt;
    if (this.fadeAlpha < 1) {
      this.fadeAlpha = Math.min(1, this.fadeAlpha + dt * 2);
    }
  }

  render(ctx) {
    const { CANVAS_WIDTH: W, CANVAS_HEIGHT: H } = CONFIG;

    ctx.fillStyle = '#050a0f';
    ctx.fillRect(0, 0, W, H);

    this.renderGrid(ctx, W, H);
    this.renderScanlines(ctx, W, H);

    ctx.globalAlpha = this.fadeAlpha;

    // ヘッダー
    ctx.fillStyle = '#0aa';
    ctx.font = '14px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('ORACLE://ANALYSIS/SUBMIT_CONCLUSION', 20, 30);

    // メインウィンドウ
    const boxX = 60;
    const boxY = 60;
    const boxW = W - 120;
    const boxH = 180;

    ctx.fillStyle = 'rgba(5, 15, 25, 0.95)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#0aa';
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // ウィンドウヘッダー
    ctx.fillStyle = '#0aa';
    ctx.fillRect(boxX, boxY, boxW, 40);
    ctx.fillStyle = '#050a0f';
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('  ORACLE', boxX + 5, boxY + 28);

    // ORACLEのセリフ
    ctx.fillStyle = '#0ff';
    ctx.font = '18px "Courier New", monospace';
    ctx.fillText('> さて、相談役。あなたの推理を聞かせてください。', boxX + 20, boxY + 70);
    ctx.fillText('> この事件の真相を、どう解き明かしましたか？', boxX + 20, boxY + 100);

    // 統計
    ctx.fillStyle = '#0aa';
    ctx.font = '14px "Courier New", monospace';
    ctx.fillText(`QUERIES_USED: ${this.questionCount}`, boxX + 20, boxY + 135);
    ctx.fillText(`TRACE_TARGET: ${STORY.puzzle.character.name}`, boxX + 20, boxY + 158);

    // 文字数カウンター
    ctx.textAlign = 'right';
    const countColor = this.charCount >= this.maxChars ? '#f44' : '#0aa';
    ctx.fillStyle = countColor;
    ctx.fillText(`CHAR_COUNT: ${this.charCount}/${this.maxChars}`, W - 80, 265);

    // 判定中オーバーレイ
    if (this.isJudging) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, W, H);

      // 処理中ウィンドウ
      const procW = 500;
      const procH = 150;
      const procX = (W - procW) / 2;
      const procY = (H - procH) / 2;

      ctx.fillStyle = 'rgba(5, 15, 25, 0.98)';
      ctx.fillRect(procX, procY, procW, procH);
      ctx.strokeStyle = '#0aa';
      ctx.strokeRect(procX, procY, procW, procH);

      ctx.fillStyle = '#0aa';
      ctx.fillRect(procX, procY, procW, 25);
      ctx.fillStyle = '#000';
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('  PROCESSING', procX + 5, procY + 17);

      ctx.fillStyle = '#0ff';
      ctx.font = '20px "Courier New", monospace';
      ctx.textAlign = 'center';
      const dots = '.'.repeat(Math.floor(this.time * 3) % 4);
      ctx.fillText(`ANALYZING ADVISOR INPUT${dots}`, W / 2, procY + 70);

      if (this.result) {
        ctx.fillStyle = '#0f0';
        ctx.fillText('ANALYSIS COMPLETE', W / 2, procY + 110);
      } else {
        ctx.fillStyle = '#066';
        ctx.fillText('Please wait...', W / 2, procY + 110);
      }
    }

    // フッター
    ctx.fillStyle = '#064';
    ctx.font = '12px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`CASE_ID: ${STORY.id.toUpperCase()}`, 20, H - 20);

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
