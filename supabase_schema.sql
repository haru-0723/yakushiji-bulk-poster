-- Supabaseの SQL Editor にそのまま貼り付けて実行してください。
create table if not exists bulk_posts (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  day_of_week text not null,
  post_type text not null check (post_type in ('asa', 'tsujou')),
  content text not null,
  delivered boolean not null default false,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  unique (week_start, day_of_week, post_type)
);
