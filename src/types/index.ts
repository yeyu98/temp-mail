// 类型定义

export interface Mailbox {
  id: number;
  email: string;
  username: string;
  domain: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  emailCount: number;
}

export interface Email {
  id: number;
  publicId: string;
  mailboxId: number;
  messageId: string | null;
  fromName: string | null;
  fromEmail: string;
  toEmail: string;
  subject: string | null;
  plainText: string | null;
  htmlContent: string | null;
  hasAttachment: boolean;
  attachmentCount: number;
  sentAt: Date | null;
  receivedAt: Date;
  isRead: boolean;
}

export interface Attachment {
  id: number;
  emailId: number;
  filename: string;
  fileSize: bigint;
  contentType: string | null;
  filePath: string;
}

// Server Actions 返回类型
export interface CreateMailboxResult {
  success: boolean;
  mailbox?: Mailbox;
  error?: string;
}

export interface GetEmailsResult {
  success: boolean;
  emails?: Email[];
  error?: string;
}

// Cloudflare Webhook 类型
export interface CloudflareEmailWebhook {
  sender: string;
  recipient: string;
  subject: string;
  raw?: string;
}
