import { getSupabaseAdmin } from '../../lib/supabase';
import { sendDiscordMessage } from '../../lib/discord';
import {
  nowInJst,
  isoWeekday,
  dayKeyFromIsoWeekday,
  mondayOfWeek,
  formatDateJst,
  DAY_LABELS_JA,
} from '../../lib/jst';

function isAuthorized(req) {
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  return Boolean(process.env.CRON_SECRET) && req.headers['authorization'] === expected;
}

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const today = nowInJst();
  const weekStartISO = formatDateJst(mondayOfWeek(today));
  const dayKey = dayKeyFromIsoWeekday(isoWeekday(today));
  const dateLabel = formatDateJst(today);

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('bulk_posts')
      .select('*')
      .eq('week_start', weekStartISO)
      .eq('day_of_week', dayKey);

    if (error) throw new Error(error.message);

    const asa = (data || []).find((r) => r.post_type === 'asa');
    const tsujou = (data || []).find((r) => r.post_type === 'tsujou');

    if (!asa || !tsujou) {
      await sendDiscordMessage(
        `⚠️ ${dateLabel}(${DAY_LABELS_JA[dayKey]})分の投稿が見つかりません。ダッシュボードから「今週分を再生成」を試してください。`
      );
      return res.status(404).json({ error: 'not found' });
    }

    const message = `📣 ${dateLabel}（${DAY_LABELS_JA[dayKey]}）の薬師寺バルク投稿\n\n【朝投稿】\n${asa.content}\n\n【通常投稿】\n${tsujou.content}`;
    await sendDiscordMessage(message);

    await supabase
      .from('bulk_posts')
      .update({ delivered: true, delivered_at: new Date().toISOString() })
      .in('id', [asa.id, tsujou.id]);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    await sendDiscordMessage(`⚠️ 本日分の投稿取得に失敗しました\n${err.message}`);
    return res.status(500).json({ error: err.message });
  }
}
