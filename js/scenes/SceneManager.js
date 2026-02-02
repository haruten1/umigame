import { TitleScene } from './TitleScene.js';
import { IntroScene } from './IntroScene.js';
import { CaseStartScene } from './CaseStartScene.js';
import { StoryScene } from './StoryScene.js';
import { QuestionScene } from './QuestionScene.js';
import { VerdictScene } from './VerdictScene.js';
import { EndingScene } from './EndingScene.js';

export class SceneManager {
  constructor(game) {
    this.game = game;
    this.currentScene = null;
    this.scenes = {};

    // シーン登録
    this.register('title', TitleScene);
    this.register('intro', IntroScene);
    this.register('caseStart', CaseStartScene);
    this.register('story', StoryScene);
    this.register('question', QuestionScene);
    this.register('verdict', VerdictScene);
    this.register('ending', EndingScene);
  }

  register(name, SceneClass) {
    this.scenes[name] = SceneClass;
  }

  async change(name, params = {}) {
    // 現在のシーンを終了
    if (this.currentScene) {
      await this.currentScene.exit();
    }

    // UI層をクリア
    this.game.uiLayer.innerHTML = '';

    // 新しいシーンを作成・開始
    const SceneClass = this.scenes[name];
    if (!SceneClass) {
      throw new Error(`Scene not found: ${name}`);
    }

    this.currentScene = new SceneClass(this.game, params);
    await this.currentScene.enter();

    console.log(`Scene changed to: ${name}`);
  }

  update(dt) {
    if (this.currentScene) {
      this.currentScene.update(dt);
    }
  }

  render(ctx) {
    if (this.currentScene) {
      this.currentScene.render(ctx);
    }
  }
}
