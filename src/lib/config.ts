// 配置文件

export const config = {
  // 邮箱域名
  mailDomain: process.env.MAIL_DOMAIN || "temp-mail.com",

  // 默认过期时间（分钟）
  mailExpireMinutes: parseInt(process.env.MAIL_EXPIRE_MINUTES || "10"),

  // App URL
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  // 公开的邮箱域名（用于前端）
  publicMailDomain: process.env.NEXT_PUBLIC_MAIL_DOMAIN || "temp-mail.com",

  // Cloudflare Webhook Secret
  webhookSecret: process.env.CF_WEBHOOK_SECRET || "",
};
