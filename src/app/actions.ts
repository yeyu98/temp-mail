"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { config } from "@/lib/config";
import * as db from "@/lib/db";
import type { Mailbox, Email, CreateMailboxResult, GetEmailsResult } from "@/types";

// 创建临时邮箱
export async function createMailbox(): Promise<CreateMailboxResult> {
  try {
    const username = nanoid(8);
    const email = `${username}@${config.mailDomain}`;
    const expiresAt = new Date(Date.now() + config.mailExpireMinutes * 60 * 1000);

    const mailbox = await db.createMailbox({
      email,
      username,
      domain: config.mailDomain,
      expiresAt,
    });

    revalidatePath("/");
    return {
      success: true,
      mailbox: mailbox as unknown as Mailbox,
    };
  } catch (error) {
    console.error("创建邮箱失败:", error);
    return {
      success: false,
      error: "创建邮箱失败，请稍后重试",
    };
  }
}

// 获取邮箱详情
export async function getMailbox(mailboxId: number): Promise<Mailbox | null> {
  try {
    const mailbox = await db.getMailboxById(mailboxId);

    if (!mailbox) return null;

    // 检查是否过期
    if (mailbox.expiresAt < new Date()) {
      await db.updateMailbox(mailboxId, { isActive: false });
      return null;
    }

    return mailbox as unknown as Mailbox;
  } catch (error) {
    console.error("获取邮箱失败:", error);
    return null;
  }
}

// 通过邮箱地址获取
export async function getMailboxByEmail(email: string): Promise<Mailbox | null> {
  try {
    const mailbox = await db.getMailboxByEmail(email);

    if (!mailbox) return null;

    // 检查是否过期
    if (mailbox.expiresAt < new Date()) {
      await db.updateMailbox(mailbox.id!, { isActive: false });
      return null;
    }

    return mailbox as unknown as Mailbox;
  } catch (error) {
    console.error("获取邮箱失败:", error);
    return null;
  }
}

// 获取邮件列表
export async function getEmails(mailboxId: number): Promise<GetEmailsResult> {
  try {
    const emails = await db.getEmailsByMailboxId(mailboxId);

    return {
      success: true,
      emails: emails as unknown as Email[],
    };
  } catch (error) {
    console.error("获取邮件列表失败:", error);
    return {
      success: false,
      error: "获取邮件列表失败",
    };
  }
}

// 获取单个邮件详情
export async function getEmail(publicId: string): Promise<Email | null> {
  try {
    const email = await db.getEmailByPublicId(publicId);

    if (!email) return null;

    return email as unknown as Email;
  } catch (error) {
    console.error("获取邮件详情失败:", error);
    return null;
  }
}

// 标记邮件为已读
export async function markAsRead(publicId: string): Promise<boolean> {
  try {
    await db.updateEmail(publicId, { isRead: true });

    revalidatePath("/mailbox/[id]");
    return true;
  } catch (error) {
    console.error("标记已读失败:", error);
    return false;
  }
}

// 刷新邮箱（延长过期时间）
export async function refreshMailbox(
  mailboxId: number,
  extendMinutes: number = 10
): Promise<CreateMailboxResult> {
  try {
    const mailbox = await db.updateMailbox(mailboxId, {
      expiresAt: new Date(Date.now() + extendMinutes * 60 * 1000),
    });

    if (!mailbox) {
      return {
        success: false,
        error: "邮箱不存在",
      };
    }

    revalidatePath("/mailbox/[id]");
    return {
      success: true,
      mailbox: mailbox as unknown as Mailbox,
    };
  } catch (error) {
    console.error("刷新邮箱失败:", error);
    return {
      success: false,
      error: "刷新邮箱失败",
    };
  }
}

// 删除邮箱
export async function deleteMailbox(mailboxId: number): Promise<boolean> {
  try {
    await db.deleteMailbox(mailboxId);

    revalidatePath("/");
    revalidatePath("/mailbox/[id]");
    return true;
  } catch (error) {
    console.error("删除邮箱失败:", error);
    return false;
  }
}

// 获取最近的邮箱列表（首页使用）
export async function getRecentMailboxes(limit: number = 5): Promise<Mailbox[]> {
  try {
    const mailboxes = await db.getRecentMailboxes(limit);

    return mailboxes as unknown as Mailbox[];
  } catch (error) {
    console.error("获取邮箱列表失败:", error);
    return [];
  }
}
