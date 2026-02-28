"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getMailboxByEmail, getEmails, refreshMailbox, markAsRead } from "@/app/actions";
import { formatTime, formatTimeRemaining, copyToClipboard, cn } from "@/lib/utils";
import { Mail, RefreshCw, ArrowLeft, Copy, Clock, Inbox, Trash2, ExternalLink } from "lucide-react";
import { EmailDialog } from "@/components/email-dialog";
import type { Mailbox, Email } from "@/types";

export default function MailboxPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.id as string;
  const emailAddress = `${username}@${process.env.NEXT_PUBLIC_MAIL_DOMAIN || "temp-mail.com"}`;

  const [mailbox, setMailbox] = useState<Mailbox | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 加载邮箱和邮件
  const loadData = async () => {
    setIsLoading(true);
    const mailboxResult = await getMailboxByEmail(emailAddress);

    if (!mailboxResult) {
      router.push("/");
      return;
    }

    setMailbox(mailboxResult);

    const emailsResult = await getEmails(mailboxResult.id);
    if (emailsResult.success && emailsResult.emails) {
      setEmails(emailsResult.emails);
    }

    setIsLoading(false);
  };

  // 刷新邮箱
  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (mailbox) {
      const result = await refreshMailbox(mailbox.id);
      if (result.success && result.mailbox) {
        setMailbox(result.mailbox);
        await loadData();
      }
    }
    setIsRefreshing(false);
  };

  // 复制邮箱地址
  const handleCopyEmail = async () => {
    const success = await copyToClipboard(emailAddress);
    setCopySuccess(success);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // 打开邮件详情
  const handleEmailClick = async (email: Email) => {
    setSelectedEmail(email);
    setIsEmailDialogOpen(true);

    // 标记为已读
    if (!email.isRead) {
      await markAsRead(email.publicId);
      setEmails(prev =>
        prev.map(e =>
          e.publicId === email.publicId ? { ...e, isRead: true } : e
        )
      );
    }
  };

  // 初始加载
  useEffect(() => {
    loadData();
  }, [emailAddress]);

  // 自动刷新（每 10 秒）
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadData();
    }, 10000);

    return () => clearInterval(interval);
  }, [emailAddress, autoRefresh]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header Skeleton */}
            <div className="mb-6">
              <Skeleton className="w-24 h-10 mb-4" />
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Email List Skeleton */}
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-3 h-3 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!mailbox) {
    return null;
  }

  const unreadCount = emails.filter(e => !e.isRead).length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="mb-4 hover:bg-white/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Button>

          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20"></div>
                    <Inbox className="w-12 h-12 text-blue-600 dark:text-blue-400 relative" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl truncate">{mailbox.email}</CardTitle>
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-2">
                      <Clock className="w-4 h-4" />
                      <span>{formatTimeRemaining(mailbox.expiresAt)}</span>
                      {unreadCount > 0 && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {unreadCount} 封未读
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCopyEmail}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "transition-all duration-300",
                      copySuccess && "bg-green-600 hover:bg-green-700 text-white border-green-600 scale-105"
                    )}
                  >
                    {copySuccess ? (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        复制
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    size="sm"
                    className="hover:scale-105 transition-all duration-300"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                    延长 10 分钟
                  </Button>
                </div>
              </div>

              {/* Auto-refresh toggle */}
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none",
                    autoRefresh ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300 ease-in-out",
                      autoRefresh ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  自动刷新 {autoRefresh && "(10秒)"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Mail className="w-5 h-5" />
              收件箱
              <span className="text-sm font-normal text-gray-500">({emails.length})</span>
            </h2>
            <div className="flex items-center gap-2">
              {autoRefresh && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  自动刷新中
                </div>
              )}
              <Button
                onClick={loadData}
                variant="outline"
                size="sm"
                className="hover:scale-105 transition-all duration-300"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                刷新
              </Button>
            </div>
          </div>

          {emails.length === 0 ? (
            <Card className="shadow-lg border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
                  <Mail className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  还没有收到邮件
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  发送邮件到 {mailbox.email} 来测试
                </p>
                <Button
                  onClick={() => router.push("/test")}
                  variant="outline"
                  size="sm"
                  className="hover:scale-105 transition-all duration-300"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  前往测试页面
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {emails.map((email, index) => (
                <Card
                  key={email.publicId}
                  className={cn(
                    "shadow cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.01]",
                    !email.isRead && "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10"
                  )}
                  style={{
                    animation: `fade-in 0.3s ease-out ${index * 0.05}s both`,
                  }}
                  onClick={() => handleEmailClick(email)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {!email.isRead && (
                            <span className="w-2.5 h-2.5 bg-blue-600 rounded-full flex-shrink-0 animate-pulse"></span>
                          )}
                          <p className={cn(
                            "font-semibold truncate",
                            !email.isRead ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
                          )}>
                            {email.fromName || email.fromEmail}
                          </p>
                          <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                            {formatTime(email.receivedAt)}
                          </span>
                        </div>
                        <p className={cn(
                          "text-sm font-medium mb-1 truncate",
                          !email.isRead ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-400"
                        )}>
                          {email.subject || "(无主题)"}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {email.plainText || email.htmlContent?.replace(/<[^>]*>/g, "") || "(无内容)"}
                        </p>
                      </div>
                      {email.hasAttachment && (
                        <div className="text-blue-600 dark:text-blue-400 flex-shrink-0 text-lg">
                          📎
                        </div>
                      )}
                      <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Email Detail Dialog */}
      <EmailDialog
        email={selectedEmail}
        open={isEmailDialogOpen}
        onClose={() => {
          setIsEmailDialogOpen(false);
          setSelectedEmail(null);
        }}
      />

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}

