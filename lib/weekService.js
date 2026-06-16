import { generateWeeklyPosts } from './anthropic';
import { getSupabaseAdmin } from './supabase';
import { DAY_KEYS, formatDateJst } from './jst';

// character: lib/characters/ の各キャラクター設定オブジェクト
// weekStartJstDate: nowInJst()系の関数で作ったJST壁時計のDateオブジェクト（その週の月曜日）
// lengthModeOverride: 'standard' | 'free140' | undefined（省略時はcharacter.defaultLengthModeを使う）
export async function generateAndStoreWeek(character, weekStartJstDate, lengthModeOverride) {
  const weekStartISO = formatDateJst(weekStartJstDate);
  const lengthMode = lengthModeOverride || character.defaultLengthMode || 'standard';
  const posts = await generateWeeklyPosts(character.systemPrompt, weekStartISO, lengthMode);

  const rows = [];
  for (const key of DAY_KEYS) {
    rows.push({
      character_id: character.slug,
      week_start: weekStartISO,
      day_of_week: key,
      post_type: 'asa',
      content: posts[key].asa,
      length_mode: lengthMode,
    });
    rows.push({
      character_id: character.slug,
      week_start: weekStartISO,
      day_of_week: key,
      post_type: 'tsujou',
      content: posts[key].tsujou,
      length_mode: lengthMode,
    });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('bulk_posts')
    .upsert(rows, { onConflict: 'character_id,week_start,day_of_week,post_type' });

  if (error) {
    throw new Error(`Supabaseへの保存に失敗しました: ${error.message}`);
  }

  return { weekStartISO, lengthMode };
}
