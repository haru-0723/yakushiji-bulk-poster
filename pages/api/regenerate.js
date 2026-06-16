import { generateAndStoreWeek } from '../../lib/weekService';
import { mondayOfWeek, nowInJst } from '../../lib/jst';
import { getCharacterBySlug, CHARACTERS } from '../../lib/characters';
import { sendDiscordMessage, resolveWebhookForCharacter } from '../../lib/discord';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  const cookie = req.cookies ? req.cookies.dashboard_auth : null;
  if (!cookie || cookie !== process.env.DASHBOARD_PASSWORD) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const slug = (req.body && req.body.character) || CHARACTERS[0].slug;
  const character = getCharacterBySlug(slug);
  if (!character) {
    return res.status(400).json({ error: `不明なキャラクターです: ${slug}` });
  }

  const webhook = resolveWebhookForCharacter(character);

  try {
    const weekStartISO = await generateAndStoreWeek(character, mondayOfWeek(nowInJst()));
    await sendDiscordMessage(
      `✅ ${character.displayName} ${weekStartISO} の週の投稿を手動で再生成しました(14本)。`,
      webhook
    );
    return res.status(200).json({ ok: true, weekStart: weekStartISO });
  } catch (err) {
    console.error(err);
    await sendDiscordMessage(
      `⚠️ ${character.displayName} の手動再生成に失敗しました\n${err.message}`,
      webhook
    );
    return res.status(500).json({ error: err.message });
  }
}
