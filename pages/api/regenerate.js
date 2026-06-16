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

  // 'standard' | 'free140' が来たらそれを優先。指定がなければキャラクターのデフォルトを使う
  const requestedMode = req.body && req.body.lengthMode;
  const lengthModeOverride =
    requestedMode === 'standard' || requestedMode === 'free140' ? requestedMode : undefined;

  const webhook = resolveWebhookForCharacter(character);

  try {
    const { weekStartISO, lengthMode } = await generateAndStoreWeek(
      character,
      mondayOfWeek(nowInJst()),
      lengthModeOverride
    );
    const modeLabel = lengthMode === 'free140' ? '140字モード' : '通常モード';
    await sendDiscordMessage(
      `✅ ${character.displayName} ${weekStartISO} の週の投稿を手動で再生成しました(14本・${modeLabel})。`,
      webhook
    );
    return res.status(200).json({ ok: true, weekStart: weekStartISO, lengthMode });
  } catch (err) {
    console.error(err);
    await sendDiscordMessage(
      `⚠️ ${character.displayName} の手動再生成に失敗しました\n${err.message}`,
      webhook
    );
    return res.status(500).json({ error: err.message });
  }
}
