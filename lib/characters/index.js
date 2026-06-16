import yakushijiBaruku from './yakushiji-baruku';
import tanakaTest from './tanaka-test';

// 新しいキャラクターを追加する手順:
// 1. lib/characters/_template.js をコピーして新しいファイルを作る
// 2. slug / displayName / systemPrompt / discordWebhookEnv を書き換える
// 3. 下のimportとCHARACTERS配列に追加する
// 4. Vercelに新しいキャラクター用のDISCORD_WEBHOOK_URL_xxxを環境変数として追加する
// 5. git push する(あとは自動で毎週・毎日の生成対象に増える)

export const CHARACTERS = [yakushijiBaruku, tanakaTest];

export function getCharacterBySlug(slug) {
  return CHARACTERS.find((c) => c.slug === slug);
}
