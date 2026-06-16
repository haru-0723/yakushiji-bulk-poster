export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  const { password } = req.body || {};

  if (!process.env.DASHBOARD_PASSWORD) {
    return res.status(500).json({ error: 'DASHBOARD_PASSWORD未設定' });
  }

  if (password && password === process.env.DASHBOARD_PASSWORD) {
    res.setHeader(
      'Set-Cookie',
      `dashboard_auth=${encodeURIComponent(password)}; HttpOnly; Path=/; Max-Age=2592000; SameSite=Lax`
    );
    return res.status(200).json({ ok: true });
  }

  return res.status(401).json({ error: 'invalid password' });
}
