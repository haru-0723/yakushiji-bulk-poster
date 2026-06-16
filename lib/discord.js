// キャラクター設定(discordWebhookEnv)から、対応するWebhook URLを環境変数経由で解決する。
// 専用のWebhookが未設定なら、デフォルトのDISCORD_WEBHOOK_URLにフォールバックする。
export function resolveWebhookForCharacter(character) {
  const dedicated = character.discordWebhookEnv
    ? process.env[character.discordWebhookEnv]
    : null;
  return dedicated || process.env.DISCORD_WEBHOOK_URL || null;
}

// Discordへの通知用。webhookUrlを省略するとDISCORD_WEBHOOK_URL(デフォルト)を使う。
// どちらも未設定の場合は何もしない（ローカル開発などで困らないように）。
export async function sendDiscordMessage(content, webhookUrl) {
  const webhook = webhookUrl || process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) {
    console.warn('Discord Webhook URL未設定のため通知をスキップしました');
    return;
  }

  // Discordの1メッセージは2000文字までなので、念のため安全側で切る
  const safeContent = content.length > 1900 ? `${content.slice(0, 1900)}…` : content;

  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ content: safeContent }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Discord通知に失敗しました (${res.status}): ${text}`);
  }
}
