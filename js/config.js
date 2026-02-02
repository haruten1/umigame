// API設定（後で環境変数等に移行）
export const CONFIG = {
  // Google AI Studio APIキー（開発用：後で秘匿化する）
  GEMINI_API_KEY: "AIzaSyDoj9jqFrbF1AZZiPJcpg0YaOLqJ_vSjEM",

  // ゲーム設定
  CANVAS_WIDTH: 1280,
  CANVAS_HEIGHT: 720,

  // ゲームバランス
  MAX_QUESTIONS: 10, // 質問可能回数
  VERDICT_MAX_LENGTH: 200, // 裁定の最大文字数

  // AI設定
  AI_MODEL: "gemini-2.5-flash",
};
