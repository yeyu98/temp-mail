# 临时邮箱项目 (Temp Mail)

快速、安全的临时邮箱服务，基于 Next.js 15 + Neon + Cloudflare Email Routing。

## 功能特性

- 🎲 随机生成临时邮箱地址
- 📧 实时接收邮件
- 🕐 邮件自动过期删除
- 📄 支持 HTML/纯文本邮件
- 🔄 自动刷新邮件列表
- ⏰ 可延长邮箱有效期
- 💬 邮件详情弹窗查看
- 🎨 优美的 UI/UX 设计

## 技术栈

- **前端**: Next.js 15 + React 19 + TailwindCSS 3 + shadcn/ui
- **后端**: Server Actions + API Routes
- **数据库**: Neon (PostgreSQL) + Drizzle ORM
- **邮件**: Cloudflare Email Routing
- **部署**: Vercel

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env.local`:

```bash
cp .env.example .env.local
```

编辑 `.env.local`:

```bash
# 数据库连接字符串（从 Neon 获取）
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require"

# 邮箱域名
MAIL_DOMAIN="temp-mail.com"
NEXT_PUBLIC_MAIL_DOMAIN="temp-mail.com"

# 默认过期时间（分钟）
MAIL_EXPIRE_MINUTES="10"

# Cloudflare Webhook Secret（可选）
CF_WEBHOOK_SECRET="your-secret"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. 初始化数据库

```bash
pnpm db:push
```

### 4. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

## 数据库操作

```bash
# 推送 schema 到数据库
pnpm db:push

# 生成迁移文件
pnpm db:generate

# 应用迁移
pnpm db:migrate

# 打开 Drizzle Studio
pnpm db:studio
```

## 部署

### Vercel 部署

1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量
3. 部署

### Cloudflare Email Routing 配置

1. 在 Cloudflare 添加域名
2. 启用 Email Routing
3. 配置转发规则：
   - 匹配: `*@yourdomain.com`
   - 转发到: `https://your-app.vercel.app/api/webhook/email`
4. 配置 MX 记录（Cloudflare 自动完成）

## 项目结构

```
src/
├── app/
│   ├── actions.ts         # Server Actions
│   ├── api/
│   │   └── webhook/
│   │       └── email/     # Cloudflare Webhook
│   ├── mailbox/
│   │   └── [id]/         # 邮箱详情页
│   ├── layout.tsx        # 根布局
│   ├── page.tsx          # 首页
│   └── globals.css       # 全局样式
├── components/
│   └── ui/               # shadcn/ui 组件
├── lib/
│   ├── config.ts         # 配置
│   ├── db.ts             # Prisma 客户端
│   ├── email-parser.ts   # 邮件解析
│   └── utils.ts          # 工具函数
└── types/
    └── index.ts          # 类型定义
```

## API 端点

### POST /api/webhook/email
接收 Cloudflare Email Routing Webhook

## License

MIT
