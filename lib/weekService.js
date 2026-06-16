import { generateWeeklyPosts } from './anthropic';
import { getSupabaseAdmin } from './supabase';
import { DAY_KEYS, formatDateJst } from './jst';

// weekStartJstDate: nowInJst()系の関数で作ったJST壁時計のDateオブジェクト（その週の月曜日）
export async function generateAndStoreWeek(weekStartJstDate) {
  const weekStartISO = formatDateJst(weekStartJstDate);
  const posts = await generateWeeklyPosts(weekStartISO);

  const rows = [];
  for (const key of DAY_KEYS) {
    rows.push({
      week_start: weekStartISO,
      day_of_week: key,
      post_type: 'asa',
      content: posts[key].asa,
    });
    rows.push({
      week_start: weekStartISO,
      day_of_week: key,
      post_type: 'tsujou',
      content: posts[key].tsujou,
    });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('bulk_posts')
    .upsert(rows, { onConflict: 'week_start,day_of_week,post_type' });

  if (error) {
    throw new Error(`Supabaseへの保存に失敗しました: ${error.message}`);
  }

  return weekStartISO;
}
