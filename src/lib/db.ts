import { db } from '@/db';
import { mailboxes, emails } from '@/db/schema';
import { desc, eq, and, sql } from 'drizzle-orm';

// 数据库查询封装

// Mailbox 相关
export async function createMailbox(data: {
  email: string;
  username: string;
  domain: string;
  expiresAt: Date;
}) {
  const [mailbox] = await db.insert(mailboxes).values(data).returning();
  return mailbox;
}

export async function getMailboxById(id: number) {
  const [mailbox] = await db.select().from(mailboxes).where(eq(mailboxes.id, id));
  return mailbox || null;
}

export async function getMailboxByEmail(email: string) {
  const [mailbox] = await db.select().from(mailboxes).where(eq(mailboxes.email, email));
  return mailbox || null;
}

export async function updateMailbox(id: number, data: {
  expiresAt?: Date;
  isActive?: boolean;
  emailCount?: number;
}) {
  const [mailbox] = await db.update(mailboxes)
    .set(data)
    .where(eq(mailboxes.id, id))
    .returning();
  return mailbox || null;
}

export async function deleteMailbox(id: number) {
  await db.delete(mailboxes).where(eq(mailboxes.id, id));
}

export async function getRecentMailboxes(limit: number = 5) {
  return await db.select()
    .from(mailboxes)
    .where(eq(mailboxes.isActive, true))
    .orderBy(desc(mailboxes.createdAt))
    .limit(limit);
}

// Email 相关
export async function createEmail(data: {
  publicId: string;
  mailboxId: number;
  messageId?: string;
  fromName?: string;
  fromEmail: string;
  toEmail: string;
  subject?: string;
  plainText?: string;
  htmlContent?: string;
  hasAttachment?: boolean;
  attachmentCount?: number;
  sentAt?: Date;
}) {
  const [email] = await db.insert(emails).values(data).returning();
  return email;
}

export async function getEmailById(id: number) {
  const [email] = await db.select().from(emails).where(eq(emails.id, id));
  return email || null;
}

export async function getEmailByPublicId(publicId: string) {
  const [email] = await db.select().from(emails).where(eq(emails.publicId, publicId));
  return email || null;
}

export async function getEmailsByMailboxId(mailboxId: number) {
  return await db.select()
    .from(emails)
    .where(eq(emails.mailboxId, mailboxId))
    .orderBy(desc(emails.receivedAt));
}

export async function updateEmail(publicId: string, data: {
  isRead?: boolean;
}) {
  const [email] = await db.update(emails)
    .set(data)
    .where(eq(emails.publicId, publicId))
    .returning();
  return email || null;
}

export async function getEmailByMessageId(messageId: string, mailboxId: number) {
  const [email] = await db.select()
    .from(emails)
    .where(and(eq(emails.messageId, messageId), eq(emails.mailboxId, mailboxId)));
  return email || null;
}

export async function incrementMailboxEmailCount(mailboxId: number) {
  await db.update(mailboxes)
    .set({ emailCount: sql`${mailboxes.emailCount} + 1` })
    .where(eq(mailboxes.id, mailboxId));
}

// 导出 db 实例
export { db };
