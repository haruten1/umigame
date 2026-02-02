import { CONFIG } from '../config.js';

/**
 * Gemini APIを呼び出す共通関数
 */
async function callGemini(systemPrompt, userMessages) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.AI_MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;

  // メッセージをGemini形式に変換
  const contents = userMessages.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API Error');
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

/**
 * YES/NO質問に回答する
 */
export async function askQuestion(puzzle, question, history) {
  const systemPrompt = `あなたは「ウミガメのスープ」形式の推理ゲームに登場する「町娘」です。
あなたは事件の当事者であり、真相を知っています。プレイヤー（相談役）からの質問に答えてください。

【事件の状況】
${puzzle.situation}

【真相】
${puzzle.truth}

ルール:
1. 質問に対して「はい」「いいえ」「関係ありません」のいずれかで答える
2. 真相に直接言及してはいけない
3. 嘘をついてはいけない
4. 曖昧な質問には「質問を明確にしてください」と答えてもよい
5. 回答は簡潔に（はい/いいえの後に一言添える程度）
6. 町娘として控えめで丁寧な口調で答える

回答形式: 「はい」「いいえ」「関係ありません」のいずれかで始め、必要なら補足を加える`;

  const messages = [...history, { role: 'user', content: question }];

  const answer = await callGemini(systemPrompt, messages);
  return { answer };
}

/**
 * プレイヤーの推理を採点する
 */
export async function judgeVerdict(puzzle, playerVerdict) {
  const systemPrompt = `あなたは「ウミガメのスープ」形式の推理ゲームの審判です。

【事件の状況】
${puzzle.situation}

【真相】
${puzzle.truth}

【プレイヤーの推理】
${playerVerdict}

プレイヤーの推理を採点してください。質問履歴は考慮せず、推理の内容のみで判断してください。

採点基準:
- 真相の核心（動機、トリック、因果関係）をどれだけ正確に言い当てているか
- 部分的に正しい場合は部分点
- 完全に的外れなら低得点

以下のJSON形式で回答してください（JSON以外は出力しないでください）:
{
  "score": 0〜100の整数,
  "feedback": "採点理由を1〜2文で",
  "truth": "真相の全容を3〜5文で説明"
}`;

  const messages = [{ role: 'user', content: '採点をお願いします。' }];

  const response = await callGemini(systemPrompt, messages);

  try {
    // JSONパース（コードブロックがある場合も対応）
    const jsonStr = response.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('JSON parse error:', e, response);
    return {
      score: 50,
      feedback: '判定中にエラーが発生しました',
      truth: puzzle.truth,
    };
  }
}
