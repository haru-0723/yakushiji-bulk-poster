import { generateAndStoreWeek } from '../../lib/weekService';
import { mondayOfWeek, nowInJst } from '../../lib/jst';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  const cookie = req.cookies ? req.cookies.dashboard_auth : null;
  if (!cookie || cookie !== process.env.DASHBOARD_PASSWORD) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  try {
    const weekStartISO = await generateAndStoreWeek(mondayOfWeek(nowInJst()));
    return res.status(200).json({ ok: true, weekStart: weekStartISO });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
