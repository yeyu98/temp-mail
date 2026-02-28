# Cloudflare Email Routing 配置指南

## 📋 前提条件

- [ ] Cloudflare 账号（免费）
- [ ] 一个域名（已添加到 Cloudflare）

---

## 第一步：添加域名到 Cloudflare

### 如果你的域名不在 Cloudflare

1. **登录 Cloudflare**
   访问：https://dash.cloudflare.com/sign-up

2. **添加站点**
   - 点击 "Add a Site" 或 "Add Site"
   - 输入你的域名（如：`yourdomain.com`）
   - 选择 **Free** 计划（免费）

3. **配置 DNS 记录**
   Cloudflare 会自动扫描你现有的 DNS 记录
   - 检查并确认所有记录都正确
   - 点击 "Continue"

4. **更换 Nameserver**
   Cloudflare 会给你两个 nameserver：
   ```
   alice.ns.cloudflare.com
   bob.ns.cloudflare.com
   ```

   去你的域名注册商（Namecheap、GoDaddy 等）：
   - 找到 DNS 管理 / Nameserver 设置
   - 替换为 Cloudflare 提供的 nameserver
   - 保存后等待 24-48 小时生效（通常几小时即可）

5. **等待 DNS 生效**
   Cloudflare 会显示检查状态
   当 nameserver 更新后，点击 "Done, check nameservers"

---

## 第二步：启用 Email Routing

### 1. 进入 Email Routing

1. 在 Cloudflare 控制台，选择你的域名
2. 在左侧菜单找到 **Email** → **Email Routing**
3. 点击 **"Get started"** 或 **"Enable Email Routing"**

### 2. 自动配置

Cloudflare 会自动添加必要的 DNS 记录：
- **MX 记录**：用于接收邮件
- **SPF/DKIM/DMARC**：用于邮件安全和防垃圾

点击 **"Use recommended settings"** 或 **"Enable"**

---

## 第三步：配置邮件转发规则

### 方式 A：直接转发到 Vercel Webhook（最简单）

1. **创建转发规则**

   点击 **"Create custom address"**

2. **配置地址**
   ```
   Address: *@yourdomain.com
   Description: 临时邮箱服务
   ```

3. **配置转发目标**

   选择 **"Send Webhook"**，然后填写：

   ```
   URL: https://你的项目.vercel.app/api/webhook/email
   Method: POST
   Headers: (可选)
     X-Cloudflare-Webhook-Secret: 你的密钥
   ```

4. **保存**
   点击 **"Save"**

---

### 方式 B：通过 Worker 转发（推荐，更灵活）

#### 1. 创建 Cloudflare Worker

在 Cloudflare 控制台：
- 进入 **Workers & Pages**
- 点击 **"Create application"**
- 选择 **"Create Worker"**
- 命名为 `temp-mail-webhook`
- 点击 **"Deploy"**

#### 2. 编辑 Worker 代码

点击 **"Edit code"**，替换为：

```javascript
export default {
  async email(message, env, ctx) {
    // Webhook URL
    const webhookUrl = 'https://你的项目.vercel.app/api/webhook/email';
    const webhookSecret = '你的密钥'; // 可选

    // 解析邮件
    const from = message.from;
    const to = message.to;
    const subject = message.headers.get('subject');
    const raw = await message.raw();

    // 转发到 Vercel
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Cloudflare-Webhook-Secret': webhookSecret,
      },
      body: JSON.stringify({
        sender: from,
        recipient: to,
        subject: subject,
        raw: raw,
      }),
    });

    // 返回成功
    message.setReject('Email forwarded');
  },
};
```

#### 3. 绑定 Worker 到 Email Routing

1. 保存并部署 Worker
2. 返回 **Email Routing** 页面
3. 点击 **"Create custom address"**
4. 配置：
   ```
   Address: *@yourdomain.com
   Actions → Send to Worker → temp-mail-webhook
   ```
5. 点击 **"Save"**

---

## 第四步：测试邮件接收

### 1. 检查 MX 记录

在终端运行：
```bash
nslookup -type=MX yourdomain.com
```

应该看到类似输出：
```
yourdomain.com MX preference = 10, mail exchanger = mx.cloudflare.net
yourdomain.com MX preference = 20, mail exchanger = mx2.cloudflare.net
```

### 2. 测试发送邮件

1. **在你的网站创建邮箱**
   - 访问你的网站
   - 创建临时邮箱，如：`test123@yourdomain.com`

2. **使用 Gmail 或其他邮箱发送测试邮件**
   - 收件人：`test123@yourdomain.com`
   - 主题：测试邮件
   - 内容：这是一封测试邮件

3. **检查是否收到**
   - 刷新邮箱页面
   - 应该能看到接收到的邮件

---

## 🔧 Webhook 数据格式

Cloudflare Email Routing 发送到 Vercel 的数据格式：

```json
{
  "sender": "someone@gmail.com",
  "recipient": "test123@yourdomain.com",
  "subject": "测试邮件",
  "raw": "原始邮件 MIME 内容..."
}
```

你的 `/api/webhook/email` 接口会接收这个数据。

---

## 🔐 安全建议

### 使用 Webhook Secret 验证

1. **生成密钥**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **在 Vercel 配置**
   环境变量：
   ```
   CF_WEBHOOK_SECRET = 你生成的密钥
   ```

3. **在 Cloudflare Worker/转发规则添加请求头**
   ```
   X-Cloudflare-Webhook-Secret: 你生成的密钥
   ```

4. **代码中验证**（已实现）
   你的 `/api/webhook/email` 代码已经有验证逻辑：
   ```typescript
   const webhookSecret = request.headers.get("X-Cloudflare-Webhook-Secret");
   if (config.webhookSecret && webhookSecret !== config.webhookSecret) {
     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }
   ```

---

## 📊 Cloudflare 免费额度

| 项目 | 免费额度 |
|------|---------|
| Email Routing | 100万封邮件/月 |
| Workers 请求 | 100万次请求/天 |
| Worker 执行时间 | 10万秒 CPU 时间/天 |

**对于临时邮箱项目，完全够用！**

---

## 🆘 故障排查

### 问题 1：收不到邮件

**检查清单：**
- [ ] MX 记录是否正确？
- [ ] Email Routing 是否启用？
- [ ] Webhook URL 是否可访问？
- [ ] Vercel 应用是否正常运行？

**测试 Webhook URL：**
```bash
curl -X POST https://你的项目.vercel.app/api/webhook/email \
  -H "Content-Type: application/json" \
  -d '{"sender":"test@gmail.com","recipient":"test@yourdomain.com","subject":"测试"}'
```

### 问题 2：MX 记录未生效

**检查工具：**
- https://mxtoolbox.com/
- https://www.whatsmydns.net/
- 在终端：`nslookup -type=MX yourdomain.com`

**解决方法：**
- 等待 DNS 传播（最长 48 小时）
- 检查 nameserver 是否正确配置

### 问题 3：Worker 返回错误

**查看 Worker 日志：**
1. Cloudflare Dashboard
2. Workers & Pages → temp-mail-webhook
3. 点击 **Logs** 查看错误信息

---

## 🎯 配置完成后

1. **你的域名邮件地址**: `*@yourdomain.com`
2. **所有邮件都会转发到**: `/api/webhook/email`
3. **自动创建邮箱并存储到**: Neon 数据库
4. **用户在网站上查看**: 实时显示收到的邮件

---

## 额外配置（可选）

### SPF/DKIM/DMARC 记录

Cloudflare 会自动配置这些，但你可以自定义：

```
类型: TXT
名称: @
内容: v=spf1 include:spf.mx.cloudflare.net ~all

类型: TXT
名称: default._domainkey
内容: (DKIM 记录，Cloudflare 自动生成)

类型: TXT
名称: _dmarc
内容: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

---

## 完成！🎉

配置完成后，你的临时邮箱服务就可以接收真实邮件了！

*更新时间: 2025-02-28*
