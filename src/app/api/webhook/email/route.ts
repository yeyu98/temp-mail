import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import * as db from "@/lib/db";
import { parseRawEmail } from "@/lib/email-parser";
import { config } from "@/lib/config";

// Cloudflare Email Routing Webhook
export async function POST(request: NextRequest) {
  try {
    // 验证 Webhook Secret（可选）
    const webhookSecret = request.headers.get("X-Cloudflare-Webhook-Secret");
    if (config.webhookSecret && webhookSecret !== config.webhookSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Cloudflare Email Routing 格式
    const { recipient, sender, subject, raw } = body;

    if (!recipient || !sender) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 解析收件人邮箱
    const [username, domain] = recipient.split("@");

    // 查找或创建邮箱
    let mailbox = await db.getMailboxByEmail(recipient);

    if (!mailbox) {
      // 自动创建邮箱
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1小时

      mailbox = await db.createMailbox({
        email: recipient,
        username,
        domain,
        expiresAt,
      });
    }

    // 解析邮件内容
    let parsedEmail;
    try {
      parsedEmail = parseRawEmail(raw || "");
    } catch (error) {
      console.error("解析邮件失败:", error);
      // 使用基本信息
      parsedEmail = {
        from: { address: sender },
        to: [{ address: recipient }],
        subject: subject || "",
        text: "",
        html: "",
      };
    }

    // 检查是否已存在（通过 message-id 去重）
    if (parsedEmail.messageId && mailbox.id) {
      const existing = await db.getEmailByMessageId(parsedEmail.messageId, mailbox.id);

      if (existing) {
        return NextResponse.json({ success: true, message: "Email already exists" });
      }
    }

    // 保存邮件
    const email = await db.createEmail({
      publicId: nanoid(16),
      mailboxId: mailbox.id!,
      messageId: parsedEmail.messageId,
      fromName: parsedEmail.from?.name,
      fromEmail: parsedEmail.from?.address || sender,
      toEmail: recipient,
      subject: parsedEmail.subject || "",
      plainText: parsedEmail.text || null,
      htmlContent: parsedEmail.html || null,
      hasAttachment: (parsedEmail.attachments?.length || 0) > 0,
      attachmentCount: parsedEmail.attachments?.length || 0,
      sentAt: parsedEmail.date || new Date(),
    });

    // 更新邮箱的邮件计数
    await db.incrementMailboxEmailCount(mailbox.id!);

    // TODO: 处理附件（如果需要）

    return NextResponse.json({
      success: true,
      emailId: email.id,
      publicId: email.publicId,
    });
  } catch (error) {
    console.error("Webhook 处理失败:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

// GET 请求用于测试
export async function GET() {
  return NextResponse.json({
    message: "Cloudflare Email Webhook Endpoint",
    status: "active",
  });
}
