import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Sparkles, AlertCircle } from "lucide-react";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";

export interface ComplianceMessage {
  id: string;
  type: "user" | "ai" | "welcome";
  text?: string;
  verdict?: "可" | "不可" | "要確認" | null;
  summary?: string;
  answer?: string;
  reference?: string;
}

interface ComplianceChatBoxProps {
  messages: ComplianceMessage[];
  onSendMessage: (question: string) => void;
  isLoading?: boolean;
  suggestedQuestions?: string[];
}

export function ComplianceChatBox({
  messages,
  onSendMessage,
  isLoading = false,
  suggestedQuestions = [],
}: ComplianceChatBoxProps) {
  const [input, setInput] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!input.trim() || isLoading || isComposing) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    onSendMessage(question);
  };

  const getVerdictColor = (verdict: string | null | undefined) => {
    switch (verdict) {
      case "可":
        return "bg-green-100 text-green-800 border-green-300";
      case "不可":
        return "bg-red-100 text-red-800 border-red-300";
      case "要確認":
        return "bg-amber-100 text-amber-800 border-amber-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getVerdictBgColor = (verdict: string | null | undefined) => {
    switch (verdict) {
      case "可":
        return "bg-green-50";
      case "不可":
        return "bg-red-50";
      case "要確認":
        return "bg-amber-50";
      default:
        return "bg-gray-50";
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-white" />
          <h2 className="text-lg font-semibold text-white">介護現場コンプライアンスAI</h2>
        </div>
        <p className="text-sm text-blue-100 mt-1">医行為の可否や訪問介護の適用範囲についてお気軽にご質問ください</p>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 || (messages.length === 1 && messages[0]?.type === "welcome") ? (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium mb-6">ご質問をどうぞ</p>
              {suggestedQuestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 mb-3">よくある質問の例：</p>
                  {suggestedQuestions.map((question, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="w-full text-left justify-start text-wrap h-auto py-2 px-3"
                      onClick={() => handleSuggestedQuestion(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {messages
                .filter((msg) => msg.type !== "welcome")
                .map((msg) => (
                <div key={msg.id} className={cn("flex", msg.type === "user" ? "justify-end" : "justify-start")}>
                  {msg.type === "user" && (
                    <Card className="max-w-md bg-blue-600 text-white border-0 p-4">
                      <p className="text-sm">{msg.text}</p>
                    </Card>
                  )}

                  {msg.type === "ai" && (
                    <Card className={cn("max-w-2xl border-0 p-4", getVerdictBgColor(msg.verdict))}>
                      {/* Verdict Badge */}
                      {msg.verdict && (
                        <div className="mb-3">
                          <Badge
                            className={cn(
                              "text-sm font-bold px-3 py-1 border",
                              getVerdictColor(msg.verdict)
                            )}
                            variant="outline"
                          >
                            {msg.verdict}
                          </Badge>
                        </div>
                      )}

                      {/* Summary */}
                      {msg.summary && (
                        <p className="font-semibold text-gray-900 mb-2">{msg.summary}</p>
                      )}

                      {/* Answer */}
                      {msg.answer && (
                        <div className="text-gray-700 text-sm mb-3">
                          <Streamdown>{msg.answer}</Streamdown>
                        </div>
                      )}

                      {/* Reference */}
                      {msg.reference && (
                        <p className="text-xs text-gray-600 border-t border-gray-300 pt-2 mt-2">
                          <strong>根拠：</strong> {msg.reference}
                        </p>
                      )}
                    </Card>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <Card className="max-w-md bg-gray-100 border-0 p-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                      <p className="text-sm text-gray-600">回答を生成中...</p>
                    </div>
                  </Card>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder="ご質問をここに入力してください..."
            className="resize-none"
            rows={3}
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-auto mt-auto"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
