// 适配 Vercel Node.js 18
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('POST only');

  let body = '';
  req.on('data', c => body += c);
  req.on('end', async () => {
    try {
      const params = new URLSearchParams(body);
      const user = params.get('user');
      const pwd  = params.get('pwd');
      const step = Number(params.get('step'));

      /* 1️⃣ 拿 access_token */
      const loginRes = await fetch('https://api-user.huami.com/registrations/+86' + user + '/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          password: pwd,
          client_id: 'HuaMi',
          redirect_uri: 'https://s3.amazonaws.com/huami-token/index.html',
          token: 'access',
        }),
      });
      if (!loginRes.ok) throw new Error('用户名或密码错误');
      const login = await loginRes.json();
      const token = login.access_token;

      /* 2️⃣ 上传今日步数（UTC 当天 00:00 的数据） */
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const uploadRes = await fetch('https://api-mifit.huami.com/v1/sport/upload', {
        method: 'POST',
        headers: {
          'apptoken': token,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          data_json: JSON.stringify([
            {
              date: today,
              type: 5,               // 5 = 步数
              value: step,
            },
          ]),
        }),
      });
      const up = await uploadRes.json();
      res.send(up.code === 1 ? '同步成功：' + step : '同步失败：' + up.message);
    } catch (e) {
      res.status(500).send('错误：' + e.message);
    }
  });
};
