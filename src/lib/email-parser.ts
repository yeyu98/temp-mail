import { simpleParser, AddressObject } from 'mailparser';
import { z } from 'zod';

// 类型定义
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
    size: number;
  }>;
}

// Zod 验证 schema（用于验证 API 请求）
export const EmailSchema = z.object({
  sender: z.string().email(),
  recipient: z.string().email(),
  subject: z.string().optional(),
  raw: z.string().optional(),
});

export type EmailInput = z.infer<typeof EmailSchema>;

/**
 * 解析原始邮件内容
 * @param rawEmail - 原始邮件 MIME 内容
 * @returns 解析后的邮件对象
 * @throws {Error} 如果解析失败
 */
export async function parseRawEmail(rawEmail: string): Promise<ParsedEmail> {
  if (!rawEmail || rawEmail.trim().length === 0) {
    throw new Error('邮件内容为空');
  }

  try {
    const email = await simpleParser(rawEmail);

    // 验证必需字段
    if (!email.from || !email.from.value || email.from.value.length === 0) {
      throw new Error('邮件缺少发件人信息');
    }

    const fromAddress = email.from.value[0];
    if (!fromAddress.address) {
      throw new Error('发件人地址无效');
    }

    return {
      from: {
        name: fromAddress.name || undefined,
        address: fromAddress.address,
      },
      to: (Array.isArray(email.to)
        ? email.to
        : email.to
        ? [email.to]
        : []
      )
        .map((addrObj) => addrObj.value || [])
        .flat()
        .filter((recipient) => recipient && !!recipient.address)
        .map((recipient) => ({
          name: recipient.name || undefined,
          address: recipient.address!,
        })),
      subject: email.subject || undefined,
      text: email.text || undefined,
      html: email.html || undefined,
      messageId: email.messageId || undefined,
      date: email.date ? new Date(email.date) : undefined,
      attachments: email.attachments?.map((att) => ({
        filename: att.filename || '',
        contentType: att.contentType || '',
        size: att.size || 0,
      })),
    };
  } catch (error) {
    console.error('解析邮件失败:', error);
    throw new Error(`邮件解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 从 "Name <email@domain.com>" 格式中提取邮箱地址
 * @param emailString - 邮箱字符串
 * @returns 邮箱地址
 */
export function extractEmailAddress(emailString: string): string {
  if (!emailString) return '';

  // 从 "Name <email@domain.com>" 格式中提取邮箱地址
  const match = emailString.match(/<(.+?)>/);
  return match ? match[1].trim() : emailString.trim();
}

/**
 * 从 "Name <email@domain.com>" 格式中提取名称
 * @param emailString - 邮箱字符串
 * @returns 名称或null
 */
export function extractName(emailString: string): string | null {
  if (!emailString) return null;

  // 从 "Name <email@domain.com>" 格式中提取名称
  const match = emailString.match(/^(.+?)\s*<.+?>$/);
  return match ? match[1].trim() : null;
}

/**
 * 从邮件地址中提取域名
 * @param emailAddress - 完整邮箱地址
 * @returns 域名
 */
export function extractDomain(emailAddress: string): string {
  if (!emailAddress) return '';

  const parts = emailAddress.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : '';
}

/**
 * 验证邮件地址格式
 * @param email - 邮箱地址
 * @returns 是否有效
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 从完整的邮件地址中提取用户名（@ 前的部分）
 * @param emailAddress - 完整邮箱地址
 * @returns 用户名
 */
export function extractUsername(emailAddress: string): string {
  if (!emailAddress) return '';

  const parts = emailAddress.split('@');
  return parts.length >= 1 ? parts[0].toLowerCase() : '';
}
