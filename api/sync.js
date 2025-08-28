// api/sync.js
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Only POST');
  }

  // 1. 先把请求体完整读出来
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      // 2. 转发给目标站
      const upstream = await fetch('https://cqzz.top/bushu/index.html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      // 3. 把上游响应原样返给前端
      const text = await upstream.text();
      res.status(upstream.status).send(text);
    } catch (e) {
      res.status(500).send('Upstream error: ' + e.message);
    }
  });
};
