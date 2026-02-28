import { pgTable, serial, text, timestamp, boolean, integer, index, varchar } from 'drizzle-orm/pg-core';

// 临时邮箱表
export const mailboxes = pgTable(
  'mailboxes',
  {
    id: serial('id').primaryKey(),
    email: text('email_address').notNull().unique(),
    username: varchar('username', { length: 100 }).notNull(),
    domain: varchar('domain', { length: 100 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    emailCount: integer('email_count').default(0).notNull(),
  },
  (table) => ({
    expiresAtIdx: index('idx_mailboxes_expires_at').on(table.expiresAt),
    emailIdx: index('idx_mailboxes_email_address').on(table.email),
  })
);

// 邮件表
export const emails = pgTable(
  'emails',
  {
    id: serial('id').primaryKey(),
    publicId: varchar('public_id', { length: 64 }).notNull().unique(),
    mailboxId: integer('mailbox_id').notNull().references(() => mailboxes.id, { onDelete: 'cascade' }),
    messageId: varchar('message_id', { length: 255 }),
    fromName: varchar('from_name', { length: 255 }),
    fromEmail: varchar('from_email', { length: 255 }).notNull(),
    toEmail: varchar('to_email', { length: 255 }).notNull(),
    subject: text('subject'),
    plainText: text('plain_text'),
    htmlContent: text('html_content'),
    hasAttachment: boolean('has_attachment').default(false).notNull(),
    attachmentCount: integer('attachment_count').default(0).notNull(),
    sentAt: timestamp('sent_at'),
    receivedAt: timestamp('received_at').defaultNow().notNull(),
    isRead: boolean('is_read').default(false).notNull(),
  },
  (table) => ({
    mailboxIdIdx: index('idx_emails_mailbox_id').on(table.mailboxId),
    receivedAtIdx: index('idx_emails_received_at').on(table.receivedAt),
    messageIdIdx: index('idx_emails_message_id').on(table.messageId),
  })
);

// 附件表
export const attachments = pgTable(
  'attachments',
  {
    id: serial('id').primaryKey(),
    emailId: integer('email_id').notNull().references(() => emails.id, { onDelete: 'cascade' }),
    filename: varchar('filename', { length: 255 }).notNull(),
    fileSize: integer('file_size').notNull(), // Note: Drizzle doesn't have BigInt type for Postgres, using integer
    contentType: varchar('content_type', { length: 100 }),
    filePath: varchar('file_path', { length: 500 }).notNull(),
  },
  (table) => ({
    emailIdIdx: index('idx_attachments_email_id').on(table.emailId),
  })
);

// 类型导出
export type Mailbox = typeof mailboxes.$inferSelect;
export type NewMailbox = typeof mailboxes.$inferInsert;
export type Email = typeof emails.$inferSelect;
export type NewEmail = typeof emails.$inferInsert;
export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;
