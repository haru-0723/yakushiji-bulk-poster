// 新しいキャラクターを追加するときのテンプレート。
// このファイルをコピーして、lib/characters/わかりやすい名前.js として保存し、
// 内容を書き換えてから lib/characters/index.js に登録してください。
// （このファイル自体はindex.jsに登録されていないので、そのままでは使われません）

const SYSTEM_PROMPT = `ここにキャラクターの人格・トンマナ・投稿ルールを書く。
薬師寺バルクのファイル(yakushiji-baruku.js)を参考に、
コンセプト / 文体ルール / 禁止事項 / 朝投稿と通常投稿のルールを記述する。`;

export default {
  slug: 'character-slug', // 半角英数とハイフンのみ。あとから変更しないこと
  displayName: 'キャラクター名',
  emoji: '✨',
  systemPrompt: SYSTEM_PROMPT,
  // Vercelの環境変数名。キャラクターごとに別のDiscordチャンネルに通知したい場合は
  // DISCORD_WEBHOOK_URL_xxx のような専用の名前にして、Vercelにも同じ名前で追加する。
  discordWebhookEnv: 'DISCORD_WEBHOOK_URL_CHANGE_ME',
};
