import { parseEmail } from "emailjs-mime-parser";

export interface ParsedEmail {
  from: {
    name?: string;
    address: string;
  };
  to: {
    name?: string;
    address: string;
  }[];
  subject?: string;
  text?: string;
  html?: string;
  messageId?: string;
  date?: Date;
  attachments?: Array<{
    filename: string;
    contentType: string;
    content: Buffer;
  }>;
}

export function parseRawEmail(rawEmail: string): ParsedEmail {
  try {
    const email = parseEmail(rawEmail) as any;

    return {
      from: {
        name: email.from?.value?.[0]?.name,
        address: email.from?.value?.[0]?.address,
      },
      to: (email.to?.value || []).map((recipient: any) => ({
        name: recipient.name,
        address: recipient.address,
      })),
      subject: email.subject || "",
      text: email.text || "",
      html: email.html || "",
      messageId: email.headers?.["message-id"] || "",
      date: email.date ? new Date(email.date) : new Date(),
      attachments: email.attachments || [],
    };
  } catch (error) {
    console.error("解析邮件失败:", error);
    throw new Error("邮件解析失败");
  }
}

export function extractEmailAddress(emailString: string): string {
  // 从 "Name <email@domain.com>" 格式中提取邮箱地址
  const match = emailString.match(/<(.+?)>/);
  return match ? match[1] : emailString.trim();
}

export function extractName(emailString: string): string | null {
  // 从 "Name <email@domain.com>" 格式中提取名称
  const match = emailString.match(/^(.+?)\s*<.+?>$/);
  return match ? match[1].trim() : null;
}
