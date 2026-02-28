"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, CheckCircle } from "lucide-react";

interface TestEmailResult {
  id: number;
  publicId: string;
  subject: string;
  fromEmail: string;
}

export default function TestPage() {
  const [mailboxEmail, setMailboxEmail] = useState("");
  const [subject, setSubject] = useState("测试邮件");
  const [from, setFrom] = useState("test@example.com");
  const [content, setContent] = useState("这是一封测试邮件，用于验证接收功能。");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    email?: TestEmailResult;
  } | null>(null);

  const handleSendTestEmail = async () => {
    if (!mailboxEmail) {
      alert("请输入邮箱地址");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/test/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mailboxEmail,
          subject,
          from: { email: from, name: "测试发件人" },
          content,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: "请求失败: " + String(error),
      });
    }

    setIsLoading(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              📧 邮件接收测试
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              发送测试邮件验证接收功能
            </p>
          </div>

          {/* Test Form */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>发送测试邮件</CardTitle>
              <CardDescription>
                填写下方信息发送一封测试邮件到指定的临时邮箱
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  目标邮箱地址 *
                </label>
                <Input
                  value={mailboxEmail}
                  onChange={(e) => setMailboxEmail(e.target.value)}
                  placeholder="abc123@temp-mail.com"
                  className="font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  提示: 先在首页创建一个临时邮箱，然后复制地址到这里
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  邮件主题
                </label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="测试邮件"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  发件人邮箱
                </label>
                <Input
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="test@example.com"
                  type="email"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  邮件内容
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="这是一封测试邮件..."
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <Button
                onClick={handleSendTestEmail}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  "发送中..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    发送测试邮件
                  </>
                )}
              </Button>

              {/* Result */}
              {result && (
                <div
                  className={`p-4 rounded-lg ${
                    result.success
                      ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <span className="text-red-600 dark:text-red-400 text-xl flex-shrink-0">✕</span>
                    )}
                    <div>
                      <p
                        className={`font-medium ${
                          result.success
                            ? "text-green-900 dark:text-green-100"
                            : "text-red-900 dark:text-red-100"
                        }`}
                      >
                        {result.message}
                      </p>
                      {result.email && (
                        <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                          <p>邮件已创建，可以到邮箱页面查看</p>
                          <Link
                            href="/"
                            className="text-blue-600 hover:underline mt-2 inline-block"
                          >
                            返回首页
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="mt-6 shadow">
            <CardHeader>
              <CardTitle className="text-lg">测试步骤</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400 list-decimal list-inside">
                <li>访问首页创建一个临时邮箱</li>
                <li>复制生成的邮箱地址</li>
                <li>粘贴到上方的&ldquo;目标邮箱地址&rdquo;输入框</li>
                <li>点击&ldquo;发送测试邮件&rdquo;按钮</li>
                <li>返回首页点击&ldquo;查看邮件&rdquo;查看接收到的邮件</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
