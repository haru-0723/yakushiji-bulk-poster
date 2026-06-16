// Discordへの通知用。Webhook URLが未設定の場合は何もしない（ローカル開発などで困らないように）。
export async function sendDiscordMessage(content) {
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) {
    console.warn('DISCORD_WEBHOOK_URL未設定のため通知をスキップしました');
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
