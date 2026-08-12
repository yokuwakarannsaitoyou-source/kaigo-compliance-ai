import { useState } from "react";
import { ComplianceChatBox, type ComplianceMessage } from "@/components/ComplianceChatBox";
import { GuidelinePanel } from "@/components/GuidelinePanel";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const SUGGESTED_QUESTIONS = [
  "利用者の爪切りをしてもいいですか？",
  "血糖値を測って、インスリンの要否を判断していい？",
  "利用者を車で病院まで送迎してもいい？",
  "利用者と同居する家族の分の洗濯もしていい？",
];

export default function Home() {
  const [messages, setMessages] = useState<ComplianceMessage[]>([
    {
      id: "welcome",
      type: "welcome",
      text: "介護現場での「医行為の可否」や「訪問介護の適用範囲（生活援助・身体介護・通院等乗降介助）」についてお気軽にご質問ください。",
    },
  ]);

  // tRPC mutation for compliance judgment
  const complianceMutation = trpc.compliance.judge.useMutation({
    onSuccess: (response) => {
      if (response.success && response.data) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            type: "ai",
            verdict: response.data.verdict,
            summary: response.data.summary,
            answer: response.data.answer,
            reference: response.data.reference,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-error-${Date.now()}`,
            type: "ai",
            verdict: null,
            summary: "エラーが発生しました",
            answer: response.error || "申し訳ありません。回答の生成中にエラーが発生しました。",
            reference: "エラー",
          },
        ]);
      }
    },
    onError: (error) => {
      console.error("Compliance judgment error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-error-${Date.now()}`,
          type: "ai",
          verdict: null,
          summary: "通信エラー",
          answer: "申し訳ありません。サーバーとの通信に失敗しました。",
          reference: "エラー",
        },
      ]);
    },
  });

  const handleSendMessage = (question: string) => {
    // Add user message to chat
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        type: "user",
        text: question,
      },
    ]);

    // Call tRPC mutation
    complianceMutation.mutate({ question });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">介護現場コンプライアンスAI</h1>
              <p className="text-sm text-gray-600 mt-1">
                医行為の可否や訪問介護のサービス範囲について、気軽に相談できるAIアシスタント
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-2">
            <ComplianceChatBox
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={complianceMutation.isPending}
              suggestedQuestions={SUGGESTED_QUESTIONS}
            />
          </div>

          {/* Sidebar - Guidelines */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <GuidelinePanel />
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Disclaimer */}
      <footer className="bg-amber-50 border-t border-amber-200 mt-12 py-4 sticky bottom-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-amber-900">
            <strong>免責事項：</strong>
            このAIの回答は参考情報であり、最終的な法的・医学的判断ではありません。実際のケア可否については、自施設マニュアル、医師の指示、看護職員の判断、最新の法令・通知・ガイドラインを優先してください。
          </p>
        </div>
      </footer>
    </div>
  );
}
