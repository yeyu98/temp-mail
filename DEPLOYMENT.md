# 部署指南 - Vercel + Cloudflare

## 📋 部署前检查清单

- [x] 代码已提交到 Git
- [ ] Vercel 账号
- [ ] Cloudflare 账号
- [ ] 域名（可选，~$10/年）

---

## 🚀 部署步骤

### 第一步：部署到 Vercel

#### 方式 A：通过 GitHub 部署（推荐）

1. **推送代码到 GitHub**

   如果你还没有 GitHub 仓库，先创建一个：

   ```bash
   # 在 GitHub 创建新仓库后
   git remote add origin https://github.com/你的用户名/temp-mail.git
   git branch -M main
   git push -u origin main
   ```

2. **在 Vercel 部署**

   - 访问 https://vercel.com/new
   - 点击 "Import Git Repository"
   - 选择你的 `temp-mail` 仓库
   - 点击 "Import"

3. **配置项目**

   ```
   Project Name: temp-mail
   Framework Preset: Next.js
   Root Directory: ./
   Build Command: pnpm build (或 npm run build)
   Output Directory: .next
   Install Command: pnpm install (或 npm install)
   ```

4. **配置环境变量**

   在 Vercel 项目设置中添加以下环境变量：

   ```bash
   DATABASE_URL = 你的 Neon 连接字符串
   MAIL_DOMAIN = 你的域名 (如: yourdomain.com)
   NEXT_PUBLIC_MAIL_DOMAIN = 你的域名
   MAIL_EXPIRE_MINUTES = 10
   NEXT_PUBLIC_APP_URL = https://你的项目.vercel.app
   CF_WEBHOOK_SECRET = 你的 Webhook 密钥 (可选)
   ```

5. **点击 Deploy**

   等待几分钟后，项目会部署成功！

---

### 第二步：配置域名

#### 方式 A：使用 Vercel 提供的域名（快速测试）

部署成功后，Vercel 会给你一个域名：
```
https://temp-mail-xxx.vercel.app
```

你可以直接使用这个域名，但**不能接收真实邮件**。

#### 方式 B：使用自己的域名（推荐，可接收邮件）

1. **购买域名**

   推荐的域名注册商：
   - Namecheap: ~$10/年
   - GoDaddy: ~$12/年
   - Cloudflare Registrar: ~$10/年（最便宜）

2. **在 Vercel 添加域名**

   - 进入 Vercel 项目 → Settings → Domains
   - 添加你的域名（如 `yourdomain.com`）
   - Vercel 会显示 DNS 配置

3. **配置 DNS**

   - 如果域名在 Cloudflare：Vercel 会自动配置
   - 如果域名在其他注册商：复制 Vercel 的 DNS 记录到注册商

---

### 第三步：配置 Cloudflare Email Routing

#### 1. 添加域名到 Cloudflare

如果你的域名不在 Cloudflare：

1. 访问 https://dash.cloudflare.com
2. 点击 "Add a Site"
3. 输入你的域名（如 `yourdomain.com`）
4. 选择 **Free** 计划
5. Cloudflare 会扫描现有 DNS 记录
6. 继续到 Cloudflare 注册商，把 nameserver 改为 Cloudflare 提供的：
   ```
   alice.ns.cloudflare.com
   bob.ns.cloudflare.com
   ```

#### 2. 启用 Email Routing

1. 在 Cloudflare 控制台，选择你的域名
2. 进入 **Email** → **Email Routing**
3. 点击 **"Get started"** 或 **"Enable"**
4. 系统会自动配置必要的 DNS 记录（MX 记录）

#### 3. 配置邮件转发规则

1. 在 Email Routing 页面，点击 **"Create custom address"**
2. 配置如下：

   ```
   Address: *@yourdomain.com
   Description: 临时邮箱

   Actions → Forward to:
   - Type: Webhook
   - URL: https://你的项目.vercel.app/api/webhook/email
   ```

3. 或者使用 Worker 转发（推荐）：

   ```
   Cloudflare Email → Cloudflare Worker → Vercel Webhook
   ```

#### 4. 配置 Webhook Secret（可选）

为了安全，建议验证 Webhook 请求：

1. 生成一个随机字符串：
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. 在 Vercel 环境变量中设置 `CF_WEBHOOK_SECRET`

3. 在 Cloudflare Worker 中添加请求头：
   ```javascript
   headers: {
     'X-Cloudflare-Webhook-Secret': '你的密钥'
   }
   ```

---

### 第四步：测试邮件接收

1. **创建测试邮箱**

   访问你的网站：`https://你的项目.vercel.app`

2. **生成邮箱地址**

   点击"创建邮箱"，获取地址：`abc123@yourdomain.com`

3. **发送测试邮件**

   使用任意邮箱（如 Gmail）发送邮件到：`abc123@yourdomain.com`

4. **查看邮件**

   在网站上点击"查看邮件"，应该能看到接收到的邮件！

---

## 🎯 快速检查清单

部署完成后，检查：

- [ ] 网站可以正常访问
- [ ] 可以创建临时邮箱
- [ ] DNS 已配置完成
- [ ] Cloudflare Email Routing 已启用
- [ ] MX 记录正常解析
- [ ] 可以接收外部邮件
- [ ] 邮件自动过期删除

---

## 📊 部署架构

```
外部邮件
    │
    ▼
Cloudflare Email Routing (接收)
    │
    ▼
Vercel Webhook (/api/webhook/email)
    │
    ▼
Neon Database (存储)
    │
    ▼
Vercel Frontend (显示)
```

---

## 🆘 常见问题

### 1. 收不到邮件？

**检查清单：**
- MX 记录是否正确配置？
- Cloudflare Email Routing 是否启用？
- Webhook URL 是否正确？
- Vercel 环境变量是否配置？

**测试 MX 记录：**
```bash
nslookup -type=MX yourdomain.com
```

### 2. Webhook 不工作？

- 检查 Vercel 日志：Vercel 项目 → Logs
- 确认 `/api/webhook/email` 路由存在
- 检查环境变量是否正确

### 3. 数据库连接失败？

- 确认 Neon 数据库已创建
- 检查 `DATABASE_URL` 是否正确
- 确认 Drizzle schema 已推送

---

## 💰 成本预估

| 项目 | 免费额度 | 实际成本 |
|------|---------|---------|
| Vercel Hobby | 100GB 带宽/月 | $0 |
| Neon | 0.5GB + 300h/月 | $0 |
| Cloudflare | 100万封邮件/月 | $0 |
| 域名 | - | ~$10/年 |
| **总计** | - | **~$10/年** |

---

## 🎉 完成！

部署完成后，你就拥有了一个完全免费的临时邮箱服务！

*更新时间: 2025-02-28*
