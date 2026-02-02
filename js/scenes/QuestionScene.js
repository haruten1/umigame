import { CONFIG } from '../config.js';
import { STORY } from '../../data/story.js';
import { askQuestion } from '../api/gemini.js';

export class QuestionScene {
  constructor(game, params) {
    this.game = game;
    this.params = params;

    this.maxQuestions = CONFIG.MAX_QUESTIONS;
    this.questionCount = 0;
    this.conversationHistory = [];

    this.inputText = '';
    this.inputElement = null;

    this.isWaiting = false;
    this.lastAnswer = null;
    this.answerDisplayTime = 0;

    this.fadeAlpha = 0;
    this.time = 0;

    // 冒頭説明フェーズ
    this.phase = 'intro'; // 'intro' | 'cutin' | 'question'
    this.introDialogues = STORY.questionPhaseIntro;
    this.introIndex = 0;
    this.introDisplayedText = '';
    this.introCharIndex = 0;
    this.introTextComplete = false;
    this.oracleFadeIn = 0;

    // カットイン演出
    this.cutinTime = 0;
    this.cutinDuration = 2.0;

    // 問題文表示
    this.showSituation = false;
  }

  async enter() {
    this.clickHandler = (e) => {
      if (this.phase === 'intro') {
        this.handleIntroClick();
      }
    };
    this.game.canvas.addEventListener('click', this.clickHandler);
  }

  async exit() {
    this.game.canvas.removeEventListener('click', this.clickHandler);
    if (this.inputElement) this.inputElement.remove();
    if (this.submitButton) this.submitButton.remove();
    if (this.verdictButton) this.verdictButton.remove();
    if (this.situationButton) this.situationButton.remove();
    if (this.situationOverlay) this.situationOverlay.remove();
  }

  handleIntroClick() {
    if (this.introTextComplete) {
      this.introIndex++;
      if (this.introIndex >= this.introDialogues.length) {
        this.phase = 'cutin';
        this.cutinTime = 0;
      } else {
        this.introDisplayedText = '';
        this.introCharIndex = 0;
        this.introTextComplete = false;
      }
    } else {
      // スキップ
      const current = this.introDialogues[this.introIndex];
      this.introDisplayedText = current.text;
      this.introCharIndex = current.text.length;
      this.introTextComplete = true;
    }
  }

  createInputElement() {
    // 問題文ボタン（SUBMIT ANALYSISの下に配置）
    this.situationButton = document.createElement('button');
    this.situationButton.className = 'game-button';
    this.situationButton.textContent = 'CASE FILE';
    this.situationButton.style.left = '1000px';
    this.situationButton.style.top = '640px';
    this.situationButton.style.background = 'linear-gradient(180deg, #1a2a3a, #0a1520)';
    this.situationButton.onclick = () => this.toggleSituation();
    this.game.uiLayer.appendChild(this.situationButton);

    // 入力欄
    this.inputElement = document.createElement('textarea');
    this.inputElement.className = 'text-input';
    this.inputElement.placeholder = '「はい」か「いいえ」で答えられる質問を入力...';
    this.inputElement.style.left = '400px';
    this.inputElement.style.top = '520px';
    this.inputElement.style.width = '580px';
    this.inputElement.style.height = '60px';
    this.inputElement.style.zIndex = '1';
    this.game.uiLayer.appendChild(this.inputElement);

    // 送信ボタン
    this.submitButton = document.createElement('button');
    this.submitButton.className = 'game-button';
    this.submitButton.textContent = 'SEND';
    this.submitButton.style.left = '1000px';
    this.submitButton.style.top = '520px';
    this.submitButton.style.zIndex = '1';
    this.submitButton.onclick = () => this.submitQuestion();
    this.game.uiLayer.appendChild(this.submitButton);

    // 推理提出ボタン
    this.verdictButton = document.createElement('button');
    this.verdictButton.className = 'game-button';
    this.verdictButton.textContent = 'SUBMIT ANALYSIS';
    this.verdictButton.style.left = '1000px';
    this.verdictButton.style.top = '580px';
    this.verdictButton.style.zIndex = '1';
    this.verdictButton.style.background = 'linear-gradient(180deg, #3a2a0a, #201505)';
    this.verdictButton.style.borderColor = '#a80';
    this.verdictButton.style.color = '#fa0';
    this.verdictButton.onclick = () => this.goToVerdict();
    this.game.uiLayer.appendChild(this.verdictButton);
  }

  toggleSituation() {
    if (this.showSituation) {
      if (this.situationOverlay) {
        this.situationOverlay.remove();
        this.situationOverlay = null;
      }
      this.showSituation = false;
    } else {
      this.situationOverlay = document.createElement('div');
      this.situationOverlay.className = 'situation-overlay';
      this.situationOverlay.innerHTML = `
        <div class="situation-content">
          <div class="situation-header">Case ${STORY.caseNumber}: ${STORY.caseTitle}</div>
          <div class="situation-text">${STORY.puzzle.situation.join('<br><br>')}</div>
          <button class="situation-close">CLOSE</button>
        </div>
      `;
      this.situationOverlay.querySelector('.situation-close').onclick = () => this.toggleSituation();
      this.situationOverlay.onclick = (e) => {
        if (e.target === this.situationOverlay) this.toggleSituation();
      };
      this.game.uiLayer.appendChild(this.situationOverlay);
      this.showSituation = true;
    }
  }

  async submitQuestion() {
    const question = this.inputElement.value.trim();
    if (!question || this.isWaiting) return;

    this.isWaiting = true;
    this.inputElement.value = '';
    this.submitButton.disabled = true;

    try {
      const response = await askQuestion(
        STORY.puzzle,
        question,
        this.conversationHistory
      );

      this.questionCount++;
      this.conversationHistory.push({ role: 'user', content: question });
      this.conversationHistory.push({ role: 'assistant', content: response.answer });

      this.lastAnswer = { question, answer: response.answer };
      this.answerDisplayTime = 0;
    } catch (error) {
      console.error('API Error:', error);
      this.lastAnswer = { question, answer: 'ERROR: TRACE CONNECTION FAILED' };
    }

    this.isWaiting = false;
    this.submitButton.disabled = false;
  }

  goToVerdict() {
    this.game.scenes.change('verdict', {
      conversationHistory: this.conversationHistory,
      questionCount: this.questionCount,
    });
  }

  update(dt) {
    this.time += dt;
    if (this.fadeAlpha < 1) {
      this.fadeAlpha = Math.min(1, this.fadeAlpha + dt * 2);
    }

    // ORACLEフェードイン
    if (this.phase === 'intro' && this.oracleFadeIn < 1) {
      this.oracleFadeIn = Math.min(1, this.oracleFadeIn + dt * 0.5);
    }

    // カットイン演出
    if (this.phase === 'cutin') {
      this.cutinTime += dt;
      if (this.cutinTime >= this.cutinDuration) {
        this.phase = 'question';
        this.createInputElement();
      }
    }

    // 冒頭テキスト表示
    if (this.phase === 'intro' && !this.introTextComplete && this.introIndex < this.introDialogues.length) {
      const current = this.introDialogues[this.introIndex];
      this.introCharIndex += dt * 30;
      if (this.introCharIndex >= current.text.length) {
        this.introCharIndex = current.text.length;
        this.introTextComplete = true;
      }
      this.introDisplayedText = current.text.slice(0, Math.floor(this.introCharIndex));
    }

    if (this.lastAnswer) {
      this.answerDisplayTime += dt;
    }
  }

  render(ctx) {
    const { CANVAS_WIDTH: W, CANVAS_HEIGHT: H } = CONFIG;

    ctx.fillStyle = '#050a0f';
    ctx.fillRect(0, 0, W, H);

    this.renderGrid(ctx, W, H);
    this.renderScanlines(ctx, W, H);

    ctx.globalAlpha = this.fadeAlpha;

    if (this.phase === 'intro') {
      this.renderIntroPhase(ctx, W, H);
    } else if (this.phase === 'cutin') {
      this.renderCutinPhase(ctx, W, H);
    } else {
      this.renderQuestionPhase(ctx, W, H);
    }

    ctx.globalAlpha = 1;
  }

  renderCutinPhase(ctx, W, H) {
    const progress = this.cutinTime / this.cutinDuration;

    // フラッシュ効果（最初）
    if (progress < 0.15) {
      const flashAlpha = 1 - (progress / 0.15);
      ctx.fillStyle = `rgba(0, 255, 255, ${flashAlpha * 0.8})`;
      ctx.fillRect(0, 0, W, H);
    }

    // 背景を暗く
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, W, H);

    // スキャンライン（激しく）
    ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
    const scanOffset = (this.cutinTime * 200) % 4;
    for (let y = scanOffset; y < H; y += 4) {
      ctx.fillRect(0, y, W, 2);
    }

    // 横線エフェクト
    const lineCount = 5;
    for (let i = 0; i < lineCount; i++) {
      const lineY = (H / lineCount) * i + (H / lineCount) / 2;
      const lineAlpha = 0.3 + Math.sin(this.cutinTime * 10 + i) * 0.2;
      ctx.fillStyle = `rgba(0, 255, 255, ${lineAlpha})`;
      ctx.fillRect(0, lineY - 1, W, 2);
    }

    // キャラクター名（スライドイン）
    const nameSlide = Math.min(1, progress * 3);
    const nameX = -300 + nameSlide * (W / 2 + 150);

    ctx.save();
    ctx.fillStyle = 'rgba(160, 0, 160, 0.9)';
    ctx.fillRect(nameX - 200, H / 2 - 40, 400, 80);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(STORY.puzzle.character.name, nameX, H / 2 + 12);
    ctx.restore();

    // INTERROGATION MODE テキスト（フェードイン）
    if (progress > 0.3) {
      const textAlpha = Math.min(1, (progress - 0.3) * 3);
      ctx.fillStyle = `rgba(0, 255, 255, ${textAlpha})`;
      ctx.font = 'bold 24px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('>>> INTERROGATION MODE <<<', W / 2, H / 2 + 80);
    }

    // フェードアウト（最後）
    if (progress > 0.8) {
      const fadeAlpha = (progress - 0.8) / 0.2;
      ctx.fillStyle = `rgba(5, 10, 15, ${fadeAlpha})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  renderIntroPhase(ctx, W, H) {
    // ヘッダー
    ctx.fillStyle = '#0aa';
    ctx.font = '14px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('ORACLE://TRACE/SUMMONING', 20, 30);

    // ORACLE立ち絵
    const oracleImg = this.game.images.oracle;
    if (oracleImg) {
      const boxY = H - 220;
      const imgHeight = 450;
      const imgWidth = (oracleImg.width / oracleImg.height) * imgHeight;
      const imgX = (W - imgWidth) / 2;
      const floatOffset = Math.sin(this.time * 0.8) * 6;
      const imgY = boxY - imgHeight + 50 + floatOffset;

      const glowAlpha = 0.5 + Math.sin(this.time * 1) * 0.3;
      ctx.globalAlpha = glowAlpha * this.oracleFadeIn;
      ctx.drawImage(oracleImg, imgX, imgY, imgWidth, imgHeight);
      ctx.globalAlpha = this.fadeAlpha;
    }

    // メッセージウィンドウ
    const boxY = H - 220;
    const boxH = 180;

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
    ctx.fillText('  ORACLE', 65, boxY + 30);

    // テキスト
    ctx.fillStyle = '#0ff';
    ctx.font = '20px "Courier New", monospace';
    ctx.fillText('> ' + this.introDisplayedText, 80, boxY + 75);

    // 続行プロンプト
    if (this.introTextComplete) {
      const blink = Math.sin(this.time * 4) > 0;
      if (blink) {
        ctx.fillStyle = '#0aa';
        ctx.font = '14px "Courier New", monospace';
        ctx.textAlign = 'right';
        ctx.fillText('[ CLICK TO CONTINUE ]', W - 80, boxY + boxH - 15);
      }
    }
  }

  renderQuestionPhase(ctx, W, H) {
    // ヘッダー
    ctx.fillStyle = '#0aa';
    ctx.font = '14px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('ORACLE://TRACE/INTERROGATION_MODE', 20, 30);

    // 残り質問数
    const remaining = this.maxQuestions - this.questionCount;
    ctx.fillStyle = remaining <= 3 ? '#f44' : '#0aa';
    ctx.textAlign = 'right';
    ctx.fillText(`QUERIES_REMAINING: ${remaining}/${this.maxQuestions}`, W - 20, 30);

    // 町娘エリア（左側）
    this.renderCharacterArea(ctx, W, H);

    // ログウィンドウ（右側）
    const logX = 400;
    const logY = 50;
    const logW = W - logX - 20;
    const logH = 440;

    ctx.fillStyle = 'rgba(5, 15, 25, 0.95)';
    ctx.fillRect(logX, logY, logW, logH);
    ctx.strokeStyle = '#0aa';
    ctx.lineWidth = 1;
    ctx.strokeRect(logX, logY, logW, logH);

    // ログヘッダー
    ctx.fillStyle = '#0aa';
    ctx.fillRect(logX, logY, logW, 25);
    ctx.fillStyle = '#050a0f';
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('  TRACE_LOG', logX + 5, logY + 17);

    // ログ内容
    this.renderHistory(ctx, logX + 15, logY + 50, logW - 30, logH - 70);

    // ローディング
    if (this.isWaiting) {
      ctx.fillStyle = '#0aa';
      ctx.font = '16px "Courier New", monospace';
      ctx.textAlign = 'center';
      const dots = '.'.repeat(Math.floor(this.time * 3) % 4);
      ctx.fillText(`PROCESSING${dots}`, W / 2 + 200, H - 130);
    }
  }

  renderCharacterArea(ctx, W, H) {
    const charX = 20;
    const charY = 100;
    const charW = 360;
    const charH = 400;

    // キャラクターウィンドウ
    ctx.fillStyle = 'rgba(5, 15, 25, 0.95)';
    ctx.fillRect(charX, charY, charW, charH);
    ctx.strokeStyle = '#a0a';
    ctx.lineWidth = 1;
    ctx.strokeRect(charX, charY, charW, charH);

    // ヘッダー
    ctx.fillStyle = '#a0a';
    ctx.fillRect(charX, charY, charW, 40);
    ctx.fillStyle = '#050a0f';
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`  ${STORY.puzzle.character.name}`, charX + 5, charY + 30);

    // 町娘画像（プレースホルダー）
    const traceImg = this.game.images.trace_woman;
    if (traceImg) {
      const imgHeight = 260;
      const imgWidth = (traceImg.width / traceImg.height) * imgHeight;
      const imgX = charX + (charW - imgWidth) / 2;
      const floatOffset = Math.sin(this.time * 0.8) * 4;
      const imgY = charY + 55 + floatOffset;

      const glowAlpha = 0.7 + Math.sin(this.time * 1.2) * 0.2;
      ctx.globalAlpha = glowAlpha;
      ctx.drawImage(traceImg, imgX, imgY, imgWidth, imgHeight);
      ctx.globalAlpha = this.fadeAlpha;
    } else {
      // プレースホルダー
      ctx.fillStyle = '#a0a';
      ctx.font = '14px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ TRACE IMAGE ]', charX + charW / 2, charY + 180);
      ctx.fillText(STORY.puzzle.character.name, charX + charW / 2, charY + 210);
    }

    // 最新の回答を表示
    if (this.lastAnswer) {
      const answerY = charY + charH - 80;
      ctx.fillStyle = 'rgba(10, 5, 15, 0.9)';
      ctx.fillRect(charX + 10, answerY, charW - 20, 70);
      ctx.strokeStyle = '#a0a';
      ctx.strokeRect(charX + 10, answerY, charW - 20, 70);

      ctx.font = '16px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = this.getAnswerColor(this.lastAnswer.answer);
      ctx.fillText(this.lastAnswer.answer, charX + charW / 2, answerY + 45);
    }
  }

  renderHistory(ctx, x, y, width, height) {
    ctx.font = '14px "Courier New", monospace';
    ctx.textAlign = 'left';

    let currentY = y;
    const lineHeight = 24;
    const maxY = y + height - lineHeight;

    if (this.conversationHistory.length === 0) {
      ctx.fillStyle = '#066';
      ctx.fillText('> Awaiting advisor query...', x, currentY);
      return;
    }

    const displayCount = Math.min(this.conversationHistory.length, 16);
    const startIndex = Math.max(0, this.conversationHistory.length - displayCount);

    for (let i = startIndex; i < this.conversationHistory.length && currentY < maxY; i++) {
      const msg = this.conversationHistory[i];

      if (msg.role === 'user') {
        ctx.fillStyle = '#08f';
        const wrapped = this.truncateText(ctx, `Q: ${msg.content}`, width);
        ctx.fillText(wrapped, x, currentY);
      } else {
        ctx.fillStyle = this.getAnswerColor(msg.content);
        ctx.fillText(`A: ${msg.content}`, x, currentY);
      }
      currentY += lineHeight;
    }
  }

  truncateText(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let truncated = text;
    while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1);
    }
    return truncated + '...';
  }

  getAnswerColor(answer) {
    if (answer.includes('YES') || answer.includes('はい')) return '#0f0';
    if (answer.includes('NO') || answer.includes('いいえ')) return '#f44';
    return '#aa0';
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
