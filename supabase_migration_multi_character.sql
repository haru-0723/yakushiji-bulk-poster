-- すでに supabase_schema.sql で bulk_posts テーブルを作成済みの場合に、
-- 複数キャラクター対応にするためのマイグレーションです。
-- Supabaseの SQL Editor に貼り付けて実行してください。

-- 1. character_id列を追加(既存の行はすべて薬師寺バルクとして扱う)
alter table bulk_posts
  add column if not exists character_id text not null default 'yakushiji-baruku';

-- 2. 既存のunique制約を、character_idを含む形に差し替える
alter table bulk_posts
  drop constraint if exists bulk_posts_week_start_day_of_week_post_type_key;

alter table bulk_posts
  add constraint bulk_posts_unique_post unique (character_id, week_start, day_of_week, post_type);
