"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createMailbox } from "./actions";
import { copyToClipboard, formatTimeRemaining, cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Copy, Mail, Plus, RefreshCw, Sparkles, Clock } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentMailbox, setCurrentMailbox] = useState<{
    email: string;
    expiresAt: Date;
  } | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCreateMailbox = async () => {
    setIsLoading(true);
    const result = await createMailbox();

    if (result.success && result.mailbox) {
      setCurrentMailbox({
        email: result.mailbox.email,
        expiresAt: new Date(result.mailbox.expiresAt),
      });
    } else {
      alert(result.error || "创建邮箱失败");
    }

    setIsLoading(false);
  };

  const handleCopyEmail = async () => {
    if (currentMailbox) {
      const success = await copyToClipboard(currentMailbox.email);
      setCopySuccess(success);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleViewMailbox = () => {
    if (currentMailbox) {
      const username = currentMailbox.email.split("@")[0];
      router.push(`/mailbox/${username}`);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      {/* Animated background pattern */}
      <div className="fixed inset-0 opacity-30 dark:opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container mx-auto px-4 py-16 relative">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
              <Mail className="w-16 h-16 text-blue-600 dark:text-blue-400 relative" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
            临时邮箱
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            快速、安全的临时邮箱服务 - 无需注册，即用即走
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                创建临时邮箱
              </CardTitle>
              <CardDescription>
                点击下方按钮生成一个随机邮箱地址，用于接收临时邮件
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!currentMailbox ? (
                <div className="text-center py-8">
                  <div className="mb-6">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <Sparkles className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <Button
                    onClick={handleCreateMailbox}
                    disabled={isLoading}
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        创建中...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        创建邮箱
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      您的临时邮箱地址：
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          value={currentMailbox.email}
                          readOnly
                          className="font-mono text-base pr-10 h-12 bg-white dark:bg-gray-900"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                      <Button
                        onClick={handleCopyEmail}
                        className={cn(
                          "h-12 px-6 transition-all duration-300",
                          copySuccess
                            ? "bg-green-600 hover:bg-green-700 text-white shadow-lg scale-105"
                            : "hover:scale-105"
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
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-slate-800 rounded-xl p-5 border border-blue-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          邮箱有效期
                        </p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {formatTimeRemaining(currentMailbox.expiresAt)}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleViewMailbox}
                      className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      查看邮件
                    </Button>
                    <Button
                      onClick={() => setCurrentMailbox(null)}
                      variant="outline"
                      className="h-12 px-6 hover:scale-105 transition-all duration-300"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      新建
                    </Button>
                  </div>
                </div>
              )}

              {/* Features */}
              <div className="border-t pt-6 mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-2">
                      10 分钟
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      默认有效期
                    </div>
                  </div>
                  <div className="p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-2">
                      ∞
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      无限邮箱
                    </div>
                  </div>
                  <div className="p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-2">
                      100%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      免费使用
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How it works */}
          <Card className="mt-8 shadow-lg bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                使用说明
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <span>点击&ldquo;创建邮箱&rdquo;按钮生成随机邮箱地址</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <span>使用此邮箱地址注册网站或服务</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <span>在邮箱页面实时查看接收到的邮件</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center text-xs font-bold">
                    4
                  </span>
                  <span>邮件会在邮箱过期后自动删除</span>
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

