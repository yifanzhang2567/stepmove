// Node.js 18 (Vercel 默认)
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Only POST allowed');
  }

  let body = '';
  req.on('data', chunk => (body += chunk));
  req.on('end', async () => {
    try {
      const params = new URLSearchParams(body);
      const user  = params.get('user');   // 邮箱
      const pwd   = params.get('pwd');    // 密码
      const step  = Number(params.get('step'));

      if (!user || !pwd || !step) {
        return res.status(400).send('参数不全');
      }

      /* 1️⃣ 拿 access_token */
      const loginRes = await fetch(
        `https://api-user.huami.com/registrations/${encodeURIComponent(user)}/tokens`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            password: pwd,
            client_id: 'HuaMi',
            redirect_uri: 'https://s3.amazonaws.com/huami-token/index.html',
            token: 'access',
            // ❗ 邮箱登录不需要 country_code
          }),
        }
      );

      if (!loginRes.ok) {
        const txt = await loginRes.text();
        throw new Error('登录失败: ' + txt);
      }

      const { access_token } = await loginRes.json();
      if (!access_token) throw new Error('未返回 token');

      /* 2️⃣ 上传今日步数 */
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const upRes = await fetch('https://api-mifit.huami.com/v1/sport/upload', {
        method: 'POST',
        headers: {
          apptoken: access_token,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          data_json: JSON.stringify([
            { date: today, type: 5, value: step },
          ]),
        }),
      });

      const up = await upRes.json();
      res.send(up.code === 1 ? '同步成功：' + step : '同步失败：' + up.message);
    } catch (e) {
      res.status(500).send('错误：' + e.message);
    }
  });
};
