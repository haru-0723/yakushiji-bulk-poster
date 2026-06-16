export default function handler(req, res) {
  res.setHeader(
    'Set-Cookie',
    'dashboard_auth=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax'
  );
  res.writeHead(302, { Location: '/' });
  res.end();
}
