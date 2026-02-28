"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, Clock, User } from "lucide-react";
import { formatTime } from "@/lib/utils";
import type { Email } from "@/types";

interface EmailDialogProps {
  email: Email | null;
  open: boolean;
  onClose: () => void;
}

export function EmailDialog({ email, open, onClose }: EmailDialogProps) {
  if (!email) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            邮件详情
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {/* 邮件头 */}
            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold mb-4">
                {email.subject || "(无主题)"}
              </h2>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">发件人:</span>
                  <span className="font-medium">
                    {email.fromName || email.fromEmail}
                    {email.fromName && email.fromName !== email.fromEmail && (
                      <span className="text-muted-foreground ml-1">
                        &lt;{email.fromEmail}&gt;
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">收件人:</span>
                  <span>{email.toEmail}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">时间:</span>
                  <span>{formatTime(email.receivedAt)}</span>
                </div>
              </div>
            </div>

            {/* 邮件内容 */}
            <div className="prose dark:prose-invert max-w-none">
              {email.htmlContent ? (
                <div
                  dangerouslySetInnerHTML={{ __html: email.htmlContent }}
                  className="email-content"
                  style={{
                    img: { maxWidth: '100%', height: 'auto' },
                  }}
                />
              ) : email.plainText ? (
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {email.plainText}
                </pre>
              ) : (
                <p className="text-muted-foreground italic">（无内容）</p>
              )}
            </div>

            {/* 附件提示 */}
            {email.hasAttachment && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <span className="text-lg">📎</span>
                <span className="text-sm">
                  {email.attachmentCount} 个附件
                </span>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
