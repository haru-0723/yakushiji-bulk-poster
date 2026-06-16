import { useState } from 'react';
import { getSupabaseAdmin } from '../lib/supabase';
import {
  DAY_KEYS,
  DAY_LABELS_JA,
  mondayOfWeek,
  nowInJst,
  formatDateJst,
  isoWeekday,
  dayKeyFromIsoWeekday,
} from '../lib/jst';
import { CHARACTERS, getCharacterBySlug } from '../lib/characters';

export async function getServerSideProps({ req, query }) {
  const cookie = req.cookies ? req.cookies.dashboard_auth : null;
  const authed = Boolean(cookie) && cookie === process.env.DASHBOARD_PASSWORD;

  if (!authed) {
    return {
      props: {
        authed: false,
        posts: [],
        weekStart: null,
        todayKey: null,
        characters: [],
        activeSlug: null,
        weekLengthMode: 'standard',
      },
    };
  }

  const requestedSlug = typeof query.c === 'string' ? query.c : null;
  const active = getCharacterBySlug(requestedSlug) || CHARACTERS[0];

  const today = nowInJst();
  const weekStart = formatDateJst(mondayOfWeek(today));
  const todayKey = dayKeyFromIsoWeekday(isoWeekday(today));

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('bulk_posts')
    .select('*')
    .eq('character_id', active.slug)
    .eq('week_start', weekStart);

  const posts = data || [];
  // この週がどちらのモードで生成されたか(未生成ならキャラクターのデフォルト)
  const weekLengthMode = posts[0]?.length_mode || active.defaultLengthMode || 'standard';

  return {
    props: {
      authed: true,
      posts,
      weekStart,
      todayKey,
      characters: CHARACTERS.map((c) => ({
        slug: c.slug,
        displayName: c.displayName,
        emoji: c.emoji,
        defaultLengthMode: c.defaultLengthMode || 'standard',
      })),
      activeSlug: active.slug,
      weekLengthMode,
    },
  };
}

function LoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      window.location.reload();
    } else {
      setError('パスワードが違います');
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-emblem">💊</div>
        <h1>投稿ダッシュボード</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="パスワード"
          autoFocus
        />
        <button type="submit" disabled={loading}>
          {loading ? '確認中...' : '入室'}
        </button>
        {error && <p className="login-error">{error}</p>}
      </form>
    </div>
  );
}

function CharCount({ content, lengthMode }) {
  const count = content ? content.length : 0;
  const overLimit = lengthMode === 'free140' && count > 140;
  return <span className={`char-count ${overLimit ? 'char-count-over' : ''}`}>{count}字</span>;
}

export default function Home({
  authed,
  posts,
  weekStart,
  todayKey,
  characters,
  activeSlug,
  weekLengthMode,
}) {
  const [regenerating, setRegenerating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedLengthMode, setSelectedLengthMode] = useState(weekLengthMode);

  if (!authed) {
    return <LoginForm />;
  }

  const activeCharacter = characters.find((c) => c.slug === activeSlug) || characters[0];

  async function handleRegenerate() {
    setRegenerating(true);
    const res = await fetch('/api/regenerate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ character: activeSlug, lengthMode: selectedLengthMode }),
    });
    setRegenerating(false);
    if (res.ok) {
      window.location.reload();
    } else {
      alert('再生成に失敗しました。時間を置いて再度試してください。');
    }
  }

  function handleCopy(id, content) {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  const grouped = DAY_KEYS.map((key) => ({
    key,
    label: DAY_LABELS_JA[key],
    asa: posts.find((p) => p.day_of_week === key && p.post_type === 'asa'),
    tsujou: posts.find((p) => p.day_of_week === key && p.post_type === 'tsujou'),
  }));

  return (
    <div className="page">
      <header className="topbar">
        <div className="title-group">
          <span className="emblem">{activeCharacter ? activeCharacter.emoji : '💊'}</span>
          <div>
            <h1>{activeCharacter ? activeCharacter.displayName : ''} 投稿ダッシュボード</h1>
            <p className="week-range">
              {weekStart} の週・{weekLengthMode === 'free140' ? '140字モード' : '通常モード'}で生成済み
            </p>
          </div>
        </div>
        <div className="topbar-actions">
          <div className="mode-toggle">
            <button
              className={`mode-btn ${selectedLengthMode === 'standard' ? 'mode-btn-active' : ''}`}
              onClick={() => setSelectedLengthMode('standard')}
              type="button"
            >
              通常
            </button>
            <button
              className={`mode-btn ${selectedLengthMode === 'free140' ? 'mode-btn-active' : ''}`}
              onClick={() => setSelectedLengthMode('free140')}
              type="button"
            >
              140字以内
            </button>
          </div>
          <button className="regen-btn" onClick={handleRegenerate} disabled={regenerating}>
            {regenerating ? '生成中...' : '選んだモードで再生成'}
          </button>
          <a className="logout-link" href="/api/logout">
            ログアウト
          </a>
        </div>
      </header>

      {characters.length > 1 && (
        <nav className="char-switcher">
          {characters.map((c) => (
            <a
              key={c.slug}
              href={`/?c=${c.slug}`}
              className={`char-tab ${c.slug === activeSlug ? 'char-tab-active' : ''}`}
            >
              {c.emoji} {c.displayName}
            </a>
          ))}
        </nav>
      )}

      <div className="pillbox">
        {grouped.map((d) => (
          <div key={d.key} className={`pill ${d.key === todayKey ? 'pill-today' : ''}`}>
            {d.label}
          </div>
        ))}
      </div>

      <main className="grid">
        {grouped.map((d) => (
          <section
            key={d.key}
            className={`day-card ${d.key === todayKey ? 'day-card-today' : ''}`}
          >
            <h2>
              {d.label}曜日{d.key === todayKey ? '・今日' : ''}
            </h2>

            <div className="post-block">
              <div className="post-label-row">
                <span className="post-label">朝投稿</span>
                {d.asa && <CharCount content={d.asa.content} lengthMode={weekLengthMode} />}
              </div>
              <p className="post-content">{d.asa ? d.asa.content : '未生成'}</p>
              {d.asa && (
                <button onClick={() => handleCopy(d.asa.id, d.asa.content)}>
                  {copiedId === d.asa.id ? 'コピーしました' : 'コピー'}
                </button>
              )}
            </div>

            <div className="post-block">
              <div className="post-label-row">
                <span className="post-label">通常投稿</span>
                {d.tsujou && <CharCount content={d.tsujou.content} lengthMode={weekLengthMode} />}
              </div>
              <p className="post-content">{d.tsujou ? d.tsujou.content : '未生成'}</p>
              {d.tsujou && (
                <button onClick={() => handleCopy(d.tsujou.id, d.tsujou.content)}>
                  {copiedId === d.tsujou.id ? 'コピーしました' : 'コピー'}
                </button>
              )}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
