import { generateAndStoreWeek } from '../../lib/weekService';
import { sendDiscordMessage } from '../../lib/discord';
import { nowInJst, nextMonday } from '../../lib/jst';

function isAuthorized(req) {
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  return Boolean(process.env.CRON_SECRET) && req.headers['authorization'] === expected;
}

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  try {
    const target = nextMonday(nowInJst());
    const weekStartISO = await generateAndStoreWeek(target);
    await sendDiscordMessage(`✅ ${weekStartISO} の週の投稿を14本生成しました。`);
    return res.status(200).json({ ok: true, weekStart: weekStartISO });
  } catch (err) {
    console.error(err);
    await sendDiscordMessage(`⚠️ 投稿の自動生成に失敗しました\n${err.message}`);
    return res.status(500).json({ error: err.message });
  }
}
