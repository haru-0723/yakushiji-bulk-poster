import { getSupabaseAdmin } from '../../lib/supabase';
import { sendDiscordMessage, resolveWebhookForCharacter } from '../../lib/discord';
import { postTweet } from '../../lib/twitter';
import {
  nowInJst,
  isoWeekday,
  dayKeyFromIsoWeekday,
  mondayOfWeek,
  formatDateJst,
  DAY_LABELS_JA,
} from '../../lib/jst';
import { CHARACTERS } from '../../lib/characters';

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

  const supabase = getSupabaseAdmin();
  const results = [];

  for (const character of CHARACTERS) {
    const webhook = resolveWebhookForCharacter(character);
    try {
      const { data, error } = await supabase
        .from('bulk_posts')
        .select('*')
        .eq('character_id', character.slug)
        .eq('week_start', weekStartISO)
        .eq('day_of_week', dayKey);

      if (error) throw new Error(error.message);

      const asa = (data || []).find((r) => r.post_type === 'asa');
      const tsujou = (data || []).find((r) => r.post_type === 'tsujou');

      if (!asa || !tsujou) {
        await sendDiscordMessage(
          `⚠️ ${character.displayName}: ${dateLabel}(${DAY_LABELS_JA[dayKey]})分の投稿が見つかりません。ダッシュボードから「今週分を再生成」を試してください。`,
          webhook
        );
        results.push({ character: character.slug, ok: false, reason: 'not found' });
        continue;
      }

      const message = `📣 ${dateLabel}（${DAY_LABELS_JA[dayKey]}）の${character.displayName}投稿\n\n【朝投稿】\n${asa.content}\n\n【通常投稿】\n${tsujou.content}`;
      await sendDiscordMessage(message, webhook);

      // X（Twitter）に投稿
      const xEnabled = process.env.X_API_KEY && process.env.X_ACCESS_TOKEN;
      if (xEnabled) {
        try {
          await postTweet(asa.content);
          await postTweet(tsujou.content);
        } catch (xErr) {
          console.error(`[${character.slug}] X投稿エラー:`, xErr);
          await sendDiscordMessage(
            `⚠️ ${character.displayName} のX投稿に失敗しました\n${xErr.message}`,
            webhook
          );
        }
      }

      await supabase
        .from('bulk_posts')
        .update({ delivered: true, delivered_at: new Date().toISOString() })
        .in('id', [asa.id, tsujou.id]);

      results.push({ character: character.slug, ok: true });
    } catch (err) {
      console.error(`[${character.slug}]`, err);
      await sendDiscordMessage(
        `⚠️ ${character.displayName} の本日分の投稿取得に失敗しました\n${err.message}`,
        webhook
      );
      results.push({ character: character.slug, ok: false, error: err.message });
    }
  }

  const anyFailed = results.some((r) => !r.ok);
  return res.status(anyFailed ? 500 : 200).json({ results });
}
