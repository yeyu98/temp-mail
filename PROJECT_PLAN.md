# 临时邮箱项目 - 技术方案文档

## 📋 项目概述

### 项目目标
开发一个临时邮箱服务，用户可以快速生成临时邮箱地址接收邮件，邮件会在一定时间后自动删除。

### 核心功能
- 🎲 随机生成临时邮箱地址
- 📧 实时接收邮件
- 🕐 邮件自动过期删除
- 📄 查看 HTML/纯文本邮件内容
- 📎 支持邮件附件（可选）
- 🔔 新邮件实时通知

---

## 🛠️ 技术栈

### 前端框架
| 技术 | 版本 | 说明 |
|------|------|------|
| Next.js | 15+ | React 全栈框架 |
| React | 19+ | UI 库 |
| TypeScript | 5.x | 类型安全 |
| TailwindCSS | 4.0 | 样式框架 |
| shadcn/ui | latest | UI 组件库（基于 Radix UI）|
| Lucide Icons | latest | 图标库 |

### 后端
| 技术 | 说明 |
|------|------|
| Server Actions | Next.js 原生服务端函数 |
| API Routes | 接收 Cloudflare Webhook |
| Zod | 数据验证 |

### 数据库
| 技术 | 说明 |
|------|------|
| Neon | PostgreSQL 数据库（Serverless） |
| Prisma | ORM（类型安全） |

### 邮件服务
| 技术 | 说明 |
|------|------|
| Cloudflare Email Routing | 邮件接收服务 |
| Webhook | 转发邮件到 Vercel |
| emailjs-mime-parser | 纯 JS 邮件解析库 |

### 部署
| 技术 | 说明 | 成本 |
|------|------|------|
| Vercel | 应用托管 | 免费 |
| Neon | 数据库托管 | 免费 |
| Cloudflare | DNS + Email Routing | 免费 |
| 域名 | 可选 | ~$10/年 |

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户浏览器                            │
│                    React + TailwindCSS                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Vercel (Next.js)                       │
│  ┌─────────────────┐         ┌─────────────────────────┐   │
│  │   前端页面       │         │   Server Actions       │   │
│  │   Page.tsx      │◀───────▶│   actions.ts            │   │
│  └─────────────────┘         └─────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   API Routes                                         │   │
│  │   /api/webhook/email  ← Cloudflare Webhook          │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Neon (PostgreSQL)                        │
│  ┌─────────────────┐         ┌─────────────────────────┐   │
│  │   mailboxes     │         │      emails             │   │
│  └─────────────────┘         └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
                    Cloudflare Email Routing
```

---

## 💾 数据库设计

### 1. mailboxes - 临时邮箱表

```sql
CREATE TABLE mailboxes (
  id              SERIAL PRIMARY KEY,
  email_address   VARCHAR(255) UNIQUE NOT NULL,
  username        VARCHAR(100) NOT NULL,
  domain          VARCHAR(100) NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at      TIMESTAMP NOT NULL,
  is_active       BOOLEAN DEFAULT TRUE,
  email_count     INTEGER DEFAULT 0
);

CREATE INDEX idx_mailboxes_expires_at ON mailboxes(expires_at);
CREATE INDEX idx_mailboxes_email_address ON mailboxes(email_address);
```

### 2. emails - 邮件表

```sql
CREATE TABLE emails (
  id              SERIAL PRIMARY KEY,
  public_id       VARCHAR(64) UNIQUE NOT NULL,
  mailbox_id      INTEGER NOT NULL,
  message_id      VARCHAR(255),
  from_name       VARCHAR(255),
  from_email      VARCHAR(255) NOT NULL,
  to_email        VARCHAR(255) NOT NULL,
  subject         TEXT,
  plain_text      TEXT,
  html_content    TEXT,
  has_attachment  BOOLEAN DEFAULT FALSE,
  sent_at         TIMESTAMP,
  received_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_read         BOOLEAN DEFAULT FALSE,

  FOREIGN KEY (mailbox_id) REFERENCES mailboxes(id) ON DELETE CASCADE
);

CREATE INDEX idx_emails_mailbox_id ON emails(mailbox_id);
CREATE INDEX idx_emails_received_at ON emails(received_at);
CREATE INDEX idx_emails_message_id ON emails(message_id);
```

### 3. attachments - 附件表（可选）

```sql
CREATE TABLE attachments (
  id              SERIAL PRIMARY KEY,
  email_id        INTEGER NOT NULL,
  filename        VARCHAR(255) NOT NULL,
  file_size       BIGINT NOT NULL,
  content_type    VARCHAR(100),
  file_path       VARCHAR(500) NOT NULL,

  FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
);

CREATE INDEX idx_attachments_email_id ON attachments(email_id);
```

---

## 🔌 API 设计

### Server Actions

```typescript
// 创建临时邮箱
createMailbox() => Mailbox

// 获取邮箱详情
getMailbox(mailboxId: string) => Mailbox | null

// 获取邮件列表
getEmails(mailboxId: string) => Email[]

// 获取邮件详情
getEmail(publicId: string) => Email | null

// 标记邮件为已读
markAsRead(publicId: string) => void

// 删除邮箱
deleteMailbox(mailboxId: string) => void

// 刷新邮箱（延长过期时间）
refreshMailbox(mailboxId: string) => Mailbox
```

### API Routes

```typescript
// POST /api/webhook/email
// 接收 Cloudflare Email Routing Webhook

Request:
{
  "sender": "someone@gmail.com",
  "recipient": "abc@yourdomain.com",
  "subject": "Hello",
  "raw": "Raw email content..."
}

Response:
{
  "success": true
}
```

---

## 📧 邮件处理流程

```
1. 外部邮件发送到 abc@yourdomain.com
   │
2. Cloudflare Email Routing 接收
   │
3. 转发到 Vercel Webhook
   │
   POST /api/webhook/email
   │
4. 解析邮件内容
   │
   - 提取发件人、主题、内容
   - 保存附件（如有）
   │
5. 存入数据库
   │
   INSERT INTO emails (...)
   │
6. 前端轮询/刷新显示新邮件
```

---

## 📁 项目结构

```
temp-mail/
├── prisma/
│   └── schema.prisma              # 数据库模型
├── src/
│   ├── app/
│   │   ├── page.tsx               # 首页
│   │   ├── mailbox/
│   │   │   └── [id]/
│   │   │       └── page.tsx       # 邮箱详情页
│   │   ├── api/
│   │   │   └── webhook/
│   │   │       └── email/
│   │   │           └── route.ts   # Cloudflare Webhook
│   │   ├── actions.ts             # Server Actions
│   │   ├── layout.tsx             # 全局布局
│   │   └── globals.css            # 全局样式
│   ├── components/
│   │   ├── ui/                    # shadcn/ui 组件
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   ├── mailbox-card.tsx       # 邮箱卡片
│   │   ├── email-list.tsx         # 邮件列表
│   │   └── email-view.tsx         # 邮件详情
│   ├── lib/
│   │   ├── db.ts                  # Prisma 客户端
│   │   ├── email-parser.ts        # 邮件解析
│   │   └── utils.ts               # 工具函数
│   └── types/
│       └── index.ts               # 类型定义
├── components.json                # shadcn/ui 配置
├── .env.example                   # 环境变量示例
├── .env.local                     # 本地环境变量（不提交）
├── next.config.ts                 # Next.js 配置
├── tailwind.config.ts             # TailwindCSS 配置
├── tsconfig.json                  # TypeScript 配置
└── package.json
```

---

## 📦 核心依赖

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "typescript": "^5.0.0",
    "@prisma/client": "^6.0.0",
    "zod": "^3.0.0",
    "nanoid": "^5.0.0",
    "date-fns": "^4.0.0",
    "emailjs-mime-parser": "^2.0.0",

    // shadcn/ui 相关
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-toast": "^1.1.5",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.344.0"
  },
  "devDependencies": {
    "prisma": "^6.0.0",
    "tailwindcss": "^4.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.0.0",
    "@types/node": "^20.0.0"
  }
}
```

### shadcn/ui 配置

shadcn/ui 不是一个 npm 包，而是通过 CLI 添加组件到项目中：

```bash
# 初始化 shadcn/ui
npx shadcn@latest init

# 添加需要的组件
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add toast
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
# ... 更多组件
```

**shadcn/ui 的优势：**
- ✅ 组件代码在你自己的项目中，完全可定制
- ✅ 基于 Radix UI，无障碍访问支持好
- ✅ 与 TailwindCSS 完美集成
- ✅ TypeScript 类型安全
- ✅ 不增加打包体积（按需添加）

**项目结构（shadcn/ui）：**
```
src/
├── components/
│   └── ui/              # shadcn/ui 组件
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── ...
```

---

## 🚀 部署方案

### 1. Vercel 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel

# 设置生产环境变量
vercel env add DATABASE_URL production
vercel env add CF_WEBHOOK_SECRET production
```

### 2. Neon 数据库

1. 注册 [Neon](https://neon.tech)
2. 创建新项目
3. 获取连接字符串
4. 配置到 Vercel 环境变量

### 3. Cloudflare Email Routing

1. 添加域名到 Cloudflare
2. 启用 Email Routing
3. 创建转发规则：
   - 匹配: `*@yourdomain.com`
   - 转发到: `https://your-app.vercel.app/api/webhook/email`
4. 配置 MX 记录（Cloudflare 自动完成）

---

## 🔐 安全考虑

| 安全措施 | 实现方式 |
|---------|---------|
| Webhook 验证 | 请求头验证 + IP 白名单 |
| SQL 注入防护 | Prisma ORM 参数化查询 |
| XSS 防护 | React 自动转义 + CSP |
| CSRF 防护 | Server Actions 内置保护 |
| 速率限制 | Vercel Edge Config 或中间件 |
| 邮箱过期 | 定时任务清理过期数据 |

---

## 💰 成本预估

| 项目 | 免费额度 | 预计成本 |
|------|---------|---------|
| Vercel Hobby | 100GB 带宽/月 | $0 |
| Neon | 0.5GB + 300小时/月 | $0 |
| Cloudflare Email Routing | 100万封邮件/月 | $0 |
| 域名（可选） | - | ~$10/年 |
| **总计** | - | **~$10/年** |

---

## 📝 开发计划

### Phase 1: 基础搭建
- [x] 技术方案设计
- [ ] 初始化 Next.js 项目
- [ ] 配置 shadcn/ui
- [ ] 配置 Prisma + Neon
- [ ] 创建数据库 Schema

### Phase 2: 核心功能
- [ ] 创建临时邮箱
- [ ] 邮箱列表展示
- [ ] 邮箱详情页面
- [ ] 实现邮件 Webhook 接收
- [ ] 邮件列表展示
- [ ] 邮件详情查看

### Phase 3: 增强功能
- [ ] 邮件自动过期
- [ ] 邮件已读标记
- [ ] 前端轮询/实时通知
- [ ] 邮箱刷新（延长过期时间）
- [ ] UI/UX 优化

### Phase 4: 部署上线
- [ ] Vercel 部署
- [ ] 配置 Neon 数据库
- [ ] 配置 Cloudflare Email Routing
- [ ] 域名配置（可选）

---

## 🎯 成功指标

- ✅ 5分钟内生成临时邮箱
- ✅ 邮件在30秒内显示
- ✅ 邮件自动过期删除
- ✅ 支持 HTML 邮件显示
- ✅ 响应式设计（移动端友好）

---

## 📚 参考资源

- [Next.js 文档](https://nextjs.org/docs)
- [Prisma 文档](https://www.prisma.io/docs)
- [Neon 文档](https://neon.tech/docs)
- [Cloudflare Email Routing](https://developers.cloudflare.com/email-routing)
- [TailwindCSS 文档](https://tailwindcss.com/docs)

---

*文档创建时间: 2025-02-28*
*最后更新时间: 2025-02-28*
