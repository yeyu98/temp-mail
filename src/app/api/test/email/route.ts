import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import * as db from "@/lib/db";

// 测试接口 - 模拟接收邮件
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mailboxEmail, subject, from, content } = body;

    if (!mailboxEmail) {
      return NextResponse.json({ error: "Missing mailboxEmail" }, { status: 400 });
    }

    // 查找邮箱
    let mailbox = await db.getMailboxByEmail(mailboxEmail);

    if (!mailbox) {
      return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });
    }

    // 创建测试邮件
    const email = await db.createEmail({
      publicId: nanoid(16),
      mailboxId: mailbox.id!,
      messageId: `test-${nanoid()}`,
      fromName: from?.name || "测试发件人",
      fromEmail: from?.email || "test@example.com",
      toEmail: mailboxEmail,
      subject: subject || "这是一封测试邮件",
      plainText: content || "这是一封测试邮件的内容。\n\n用于验证邮件接收功能是否正常工作。",
      htmlContent: `<p>${content || "这是一封测试邮件的内容。"}</p><p>用于验证邮件接收功能是否正常工作。</p>`,
      hasAttachment: false,
      attachmentCount: 0,
      sentAt: new Date(),
    });

    // 更新邮箱的邮件计数
    await db.incrementMailboxEmailCount(mailbox.id!);

    return NextResponse.json({
      success: true,
      message: "测试邮件已创建",
      email: {
        id: email.id,
        publicId: email.publicId,
        subject: email.subject,
        fromEmail: email.fromEmail,
      },
    });
  } catch (error) {
    console.error("测试邮件创建失败:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
