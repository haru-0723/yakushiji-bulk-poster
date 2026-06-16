// Vercelのサーバーは基本UTCで動作するため、日本時間(JST = UTC+9)を
// 明示的に計算するためのヘルパー。

export const DAY_KEYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const DAY_LABELS_JA = {
  monday: '月',
  tuesday: '火',
  wednesday: '水',
  thursday: '木',
  friday: '金',
  saturday: '土',
  sunday: '日',
};

const DAY_MS = 24 * 60 * 60 * 1000;

// 現在時刻をJSTの壁時計時刻として表すDateオブジェクトを返す。
// （getUTCXxx系のメソッドでJSTの値が読み取れるようにUTC+9時間ずらしている）
export function nowInJst() {
  const now = new Date();
  return new Date(now.getTime() + 9 * 60 * 60 * 1000);
}

// jstDate（nowInJstで作ったもの）から ISO形式の曜日番号を返す（1=月曜...7=日曜）
export function isoWeekday(jstDate) {
  const day = jstDate.getUTCDay(); // 0=日曜...6=土曜
  return day === 0 ? 7 : day;
}

export function dayKeyFromIsoWeekday(n) {
  return DAY_KEYS[n - 1];
}

export function formatDateJst(jstDate) {
  const y = jstDate.getUTCFullYear();
  const m = String(jstDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(jstDate.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// jstDateが属する週の月曜日を返す
export function mondayOfWeek(jstDate) {
  const wd = isoWeekday(jstDate); // 1..7
  const diff = wd - 1;
  return new Date(jstDate.getTime() - diff * DAY_MS);
}

// jstDateより後の、直近の月曜日を返す（jstDateが月曜の場合は7日後）
export function nextMonday(jstDate) {
  const wd = isoWeekday(jstDate);
  const diff = (8 - wd) % 7 || 7;
  return new Date(jstDate.getTime() + diff * DAY_MS);
}
