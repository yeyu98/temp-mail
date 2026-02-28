# Cloudflare Worker 转发邮件到 Vercel

由于 Cloudflare Email Routing 的界面更新，现在需要通过 Worker 转发邮件到 Vercel。

## 📋 完整步骤

### 第一步：创建 Cloudflare Worker

1. **进入 Workers 页面**

   在 Cloudflare 控制台：
   - 左侧菜单找到 **Workers & Pages**
   - 点击 **"Create application"**
   - 选择 **"Create Worker"**
   - 命名为 `temp-mail-webhook`
   - 点击 **"Deploy"**

2. **编辑 Worker 代码**

   部署后，点击 **"Edit code"**，将代码替换为：

```javascript
export default {
  async email(message, env, ctx) {
    // Vercel Webhook URL - 部署后替换为你的实际 URL
    const webhookUrl = 'https://你的项目.vercel.app/api/webhook/email';

    // Webhook Secret（可选，用于验证）
    const webhookSecret = '你的密钥'; // 从 Vercel 环境变量获取

    try {
      // 解析邮件
      const from = message.from;
      const to = message.to;
      const subject = message.headers.get('subject');
      const raw = await message.raw();

      console.log(`Processing email from ${from} to ${to}`);

      // 转发到 Vercel
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Cloudflare-Worker',
          ...(webhookSecret && { 'X-Cloudflare-Webhook-Secret': webhookSecret }),
        },
        body: JSON.stringify({
          sender: from,
          recipient: to,
          subject: subject,
          raw: raw,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Vercel webhook error:', errorText);
        throw new Error(`Webhook failed: ${response.status}`);
      }

      console.log('Email forwarded successfully');

      // 成功转发
      message.setReject('Email forwarded successfully');

    } catch (error) {
      console.error('Error processing email:', error);
      // 即使失败也接受邮件，避免丢失
      message.setReject('Email accepted but webhook failed');
    }
  },
};
```

3. **保存并部署**

   点击右上角的 **"Deploy"** 按钮

---

### 第二步：绑定 Worker 到 Email Routing

1. **返回 Email Routing 页面**

   Cloudflare Dashboard → Email → Email Routing

2. **创建转发规则**

   点击 **"Create custom address"**，配置：

   ```
   ┌─────────────────────────────────────┐
   │  Custom address                     │
   │  Address: *@yourdomain.com          │
   │  Description: 临时邮箱转发          │
   │                                     │
   │  Actions:                           │
   │  ├─ Send to Worker                  │
   │  └─ 选择: temp-mail-webhook         │
   └─────────────────────────────────────┘
   ```

3. **保存**
   点击 **"Save"**

---

## 🔧 完整的数据流程

```
外部邮件发送到 test@yourdomain.com
         ↓
Cloudflare Email Routing 接收
         ↓
触发 Worker: temp-mail-webhook
         ↓
Worker 转发到 Vercel Webhook
(POST https://你的项目.vercel.app/api/webhook/email)
         ↓
Vercel API 接收并解析邮件
         ↓
存储到 Neon 数据库
         ↓
用户在网站上查看邮件
```

---

## 🎯 Worker 代码说明

### 核心功能

1. **接收邮件事件**
   ```javascript
   async email(message, env, ctx)
   ```

2. **提取邮件信息**
   ```javascript
   const from = message.from;        // 发件人
   const to = message.to;            // 收件人
   const subject = message.headers.get('subject');
   const raw = await message.raw(); // 原始邮件
   ```

3. **转发到 Vercel**
   ```javascript
   await fetch(webhookUrl, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ sender, recipient, subject, raw })
   });
   ```

4. **处理结果**
   ```javascript
   message.setReject('Email forwarded');
   ```

---

## 🔐 配置 Webhook Secret（推荐）

### 1. 生成密钥

在终端运行：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. 在 Vercel 配置

Vercel 项目 → Settings → Environment Variables：
```
CF_WEBHOOK_SECRET = 你生成的密钥
```

### 3. 在 Worker 中使用

更新 Worker 代码，添加密钥：
```javascript
const webhookSecret = '你生成的密钥';

headers: {
  'X-Cloudflare-Webhook-Secret': webhookSecret
}
```

### 4. 验证（已实现）

你的 `/api/webhook/email` 代码会验证这个密钥：
```typescript
if (config.webhookSecret && webhookSecret !== config.webhookSecret) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

---

## 🧪 测试 Worker

### 测试方式 1：查看 Worker 日志

1. Cloudflare Dashboard
2. Workers & Pages → temp-mail-webhook
3. **Logs** 标签
4. 发送测试邮件，查看日志输出

### 测试方式 2：使用 curl 测试 Webhook

```bash
curl -X POST https://你的项目.vercel.app/api/webhook/email \
  -H "Content-Type: application/json" \
  -H "X-Cloudflare-Webhook-Secret: 你的密钥" \
  -d '{
    "sender": "test@gmail.com",
    "recipient": "abc@yourdomain.com",
    "subject": "测试"
  }'
```

---

## 📊 Worker 免费额度

| 资源 | 免费额度 |
|------|---------|
| 请求次数 | 100,000 次/天 |
| CPU 时间 | 10 分钟/天 |
| 邮件数量 | Email Routing 100万封/月 |

**完全够用！**

---

## 🆘 常见问题

### 问题 1：Worker 没有被触发

**检查：**
- Worker 是否已部署？
- Email Routing 是否绑定到 Worker？
- MX 记录是否正确？

### 问题 2：Worker 返回错误

**查看日志：**
1. Workers & Pages → temp-mail-webhook
2. Logs 标签
3. 查看具体错误信息

### 问题 3：邮件转发失败

**可能原因：**
- Vercel Webhook URL 不正确
- Vercel 应用正在休眠（首次请求会慢）
- 网络问题

**解决方法：**
- 确认 Vercel URL 正确
- 检查 Vercel Logs
- 添加错误日志到 Worker

---

## 完成后

1. **Worker 会自动接收邮件**
2. **转发到 Vercel API**
3. **存储到数据库**
4. **用户在网站查看**

*更新时间: 2025-02-28*
