// API設定
export const CONFIG = {
  // Cloudflare Worker URL（デプロイ後に設定）
  WORKER_URL: "https://umigame-gemini-proxy.ruirairin.workers.dev",

  // ゲーム設定
  CANVAS_WIDTH: 1280,
  CANVAS_HEIGHT: 720,

  // ゲームバランス
  MAX_QUESTIONS: 20, // 質問可能回数
  VERDICT_MAX_LENGTH: 200, // 裁定の最大文字数

  // AI設定
  AI_MODEL: "gemini-2.5-flash",
};
