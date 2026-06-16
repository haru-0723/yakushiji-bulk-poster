import { generateAndStoreWeek } from '../../lib/weekService';
import { sendDiscordMessage, resolveWebhookForCharacter } from '../../lib/discord';
import { nowInJst, nextMonday } from '../../lib/jst';
import { CHARACTERS } from '../../lib/characters';

function isAuthorized(req) {
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  return Boolean(process.env.CRON_SECRET) && req.headers['authorization'] === expected;
}

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const target = nextMonday(nowInJst());
  const results = [];

  for (const character of CHARACTERS) {
    const webhook = resolveWebhookForCharacter(character);
    try {
      const weekStartISO = await generateAndStoreWeek(character, target);
      await sendDiscordMessage(
        `✅ ${character.displayName} ${weekStartISO} の週の投稿を14本生成しました。`,
        webhook
      );
      results.push({ character: character.slug, ok: true, weekStart: weekStartISO });
    } catch (err) {
      console.error(`[${character.slug}]`, err);
      await sendDiscordMessage(
        `⚠️ ${character.displayName} の投稿の自動生成に失敗しました\n${err.message}`,
        webhook
      );
      results.push({ character: character.slug, ok: false, error: err.message });
    }
  }

  const anyFailed = results.some((r) => !r.ok);
  return res.status(anyFailed ? 500 : 200).json({ results });
}
