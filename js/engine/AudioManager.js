export class AudioManager {
  constructor() {
    this.bgm = null;
    this.bgmVolume = 0.5;
    this.seVolume = 0.7;
    this.audioContext = null;
  }

  // AudioContext初期化（ユーザー操作後に呼ぶ）
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  // BGM再生
  playBGM(src, loop = true) {
    this.stopBGM();

    this.bgm = new Audio(src);
    this.bgm.loop = loop;
    this.bgm.volume = this.bgmVolume;
    this.bgm.play().catch((e) => {
      console.warn('BGM autoplay blocked:', e);
    });
  }

  // BGM停止
  stopBGM() {
    if (this.bgm) {
      this.bgm.pause();
      this.bgm.currentTime = 0;
      this.bgm = null;
    }
  }

  // BGMフェードアウト
  fadeBGM(duration = 1000) {
    if (!this.bgm) return;

    const startVolume = this.bgm.volume;
    const startTime = performance.now();

    const fade = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / duration);

      if (this.bgm) {
        this.bgm.volume = startVolume * (1 - progress);

        if (progress < 1) {
          requestAnimationFrame(fade);
        } else {
          this.stopBGM();
        }
      }
    };

    requestAnimationFrame(fade);
  }

  // SE再生
  playSE(src) {
    const se = new Audio(src);
    se.volume = this.seVolume;
    se.play().catch((e) => {
      console.warn('SE play failed:', e);
    });
  }

  // 音量設定
  setBGMVolume(volume) {
    this.bgmVolume = Math.max(0, Math.min(1, volume));
    if (this.bgm) {
      this.bgm.volume = this.bgmVolume;
    }
  }

  setSEVolume(volume) {
    this.seVolume = Math.max(0, Math.min(1, volume));
  }
}
