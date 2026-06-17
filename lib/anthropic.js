import { DAY_KEYS } from './jst';

const STANDARD_LENGTH_INSTRUCTION = `通常投稿(tsujou)は500字程度を目安にしてください。`;

const FREE140_LENGTH_INSTRUCTION = `この週はX(旧Twitter)の無料プランの文字数制限に合わせて作成します。asaとtsujouのどちらも【全角130字以上140字以内】を最優先にしてください(130字未満はNG、140字超えもNG)。
通常投稿(tsujou)は、500字版のような詳しい説明は入れず、伝えたい要点を1つだけに絞って短くまとめてください。実践ヒントは一言で十分です。絵文字は文字数を圧迫するので、朝投稿の「おはバルク💊」以外では基本的に使わないでください。130字に満たない場合は、内容を補足するか言い回しを変えて必ず130字以上にしてください。`;

function buildUserPrompt(weekStartLabel, lengthMode) {
  const lengthInstruction =
    lengthMode === 'free140' ? FREE140_LENGTH_INSTRUCTION : STANDARD_LENGTH_INSTRUCTION;

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

各曜日のasaは必ず「おはバルク💊」から始めてください。
${lengthInstruction}
7日分すべてのキーを必ず含めてください。`;
}

function stripJsonFence(text) {
  return text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
}

// lengthMode: 'standard' | 'free140'
export async function generateWeeklyPosts(systemPrompt, weekStartLabel, lengthMode = 'standard') {
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
      system: systemPrompt,
      messages: [{ role: 'user', content: buildUserPrompt(weekStartLabel, lengthMode) }],
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

  if (lengthMode === 'free140') {
    for (const key of DAY_KEYS) {
      if (parsed[key].asa.length > 140) {
        console.warn(`[length-check] ${key}.asa が140字を超えています (${parsed[key].asa.length}字)`);
      }
      if (parsed[key].asa.length < 130) {
        console.warn(`[length-check] ${key}.asa が130字未満です (${parsed[key].asa.length}字)`);
      }
      if (parsed[key].tsujou.length > 140) {
        console.warn(`[length-check] ${key}.tsujou が140字を超えています (${parsed[key].tsujou.length}字)`);
      }
      if (parsed[key].tsujou.length < 130) {
        console.warn(`[length-check] ${key}.tsujou が130字未満です (${parsed[key].tsujou.length}字)`);
      }
    }
  }

  return parsed;
}
