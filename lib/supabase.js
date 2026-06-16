import { createClient } from '@supabase/supabase-js';

// サーバー側（API Routes）専用のSupabaseクライアント。
// SERVICE_ROLE_KEYを使うので、絶対にクライアント側（ブラウザ）には渡さないこと。
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が設定されていません');
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
