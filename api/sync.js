// Vercel 无服务器函数，路径：/api/sync
export default async function handler(req, res) {
  // 允许跨域
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  // 1) 把浏览器发过来的 body 原样转发给 cqzz.top
  const upstream = await fetch('https://cqzz.top/bushu/index.html', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: req.body,
  });

  // 2) 把目标站的响应原样返还给前端
  const text = await upstream.text();
  res.status(upstream.status).send(text);
}