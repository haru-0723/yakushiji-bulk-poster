import { CHARACTERS } from '../../lib/characters';

function getPasswordEnvForSlug(slug) {
  const envKey = 'DASHBOARD_PASSWORD_' + slug.toUpperCase().replace(/-/g, '_');
  return process.env[envKey] || process.env.DASHBOARD_PASSWORD;
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  const { password, character } = req.body || {};
  const slug = character && CHARACTERS.find((c) => c.slug === character) ? character : CHARACTERS[0].slug;
  const expected = getPasswordEnvForSlug(slug);

  if (!expected) {
    return res.status(500).json({ error: 'パスワード未設定' });
  }

  if (password && password === expected) {
    res.setHeader(
      'Set-Cookie',
      `dashboard_auth=${encodeURIComponent(password)}; HttpOnly; Path=/; Max-Age=2592000; SameSite=Lax`
    );
    res.setHeader(
      'Set-Cookie',
      [
        `dashboard_auth=${encodeURIComponent(password)}; HttpOnly; Path=/; Max-Age=2592000; SameSite=Lax`,
        `dashboard_character=${encodeURIComponent(slug)}; Path=/; Max-Age=2592000; SameSite=Lax`,
      ]
    );
    return res.status(200).json({ ok: true, character: slug });
  }

  return res.status(401).json({ error: 'invalid password' });
}
