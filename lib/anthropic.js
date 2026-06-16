import { SYSTEM_PROMPT } from './character-prompt';
import { DAY_KEYS } from './jst';

function buildUserPrompt(weekStartLabel) {
  return `${weekStartLabel}を月曜日とする1週間分の投稿を作成してください。

出力は次のJSON形式のみで返してください。前置き・説明文・Markdownのコードブロック(\`\`\`)は一切含めず、JSONオブジェクトのみを出力してください。

{
  "monday": { "asa": "朝投稿の本文", "tsujou": "通常投稿の本文" },
  "tuesday": { "asa": "...", "tsujou": "..." },
  "wednesday": { "asa": "...", "tsujou": "..." },
  "thursday": { "asa": "...", "tsujou": "..." },
  "friday": { "asa": "...", "tsujou": "..." },
  "saturday": { "asa": "...", "tsujou": "..." },
  "sunday": { "asa": "...", "tsujou": "..." }
}

各曜日のasaは必ず「おはバルク💊」から始めてください。tsujouは500字程度を目安にしてください。
7日分すべてのキーを必ず含めてください。`;
}

function stripJsonFence(text) {
  return text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
}

export async function generateWeeklyPosts(weekStartLabel) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY が設定されていません');
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(weekStartLabel) }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic APIエラー (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const textBlock = (data.content || []).find((b) => b.type === 'text');
  if (!textBlock) {
    throw new Error('Anthropicの応答にテキストが見つかりませんでした');
  }

  const cleaned = stripJsonFence(textBlock.text);

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(
      `生成結果のJSON解析に失敗しました: ${e.message}\n応答冒頭: ${cleaned.slice(0, 300)}`
    );
  }

  for (const key of DAY_KEYS) {
    if (!parsed[key] || !parsed[key].asa || !parsed[key].tsujou) {
      throw new Error(`${key}の投稿データが不完全です（生成し直してください）`);
    }
  }

  return parsed;
}
