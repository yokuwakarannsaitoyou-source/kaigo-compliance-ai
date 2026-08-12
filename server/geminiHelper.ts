import { ENV } from "./_core/env";

export interface GeminiComplianceResponse {
  verdict: "可" | "不可" | "要確認" | null;
  summary: string;
  answer: string;
  reference: string;
}

/**
 * Google Gemini APIを使用してコンプライアンス判定を実行
 * @param question ユーザーからの質問
 * @param systemPrompt システムプロンプト
 * @returns コンプライアンス判定結果
 */
export async function judgeComplianceWithGemini(
  question: string,
  systemPrompt: string
): Promise<GeminiComplianceResponse> {
  if (!ENV.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${systemPrompt}\n\n質問: ${question}`,
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
      maxOutputTokens: 1024,
    },
  };

  try {
    const response = await fetch(`${apiUrl}?key=${ENV.geminiApiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // ステータスコードの確認
    if (response.status === 429) {
      throw new Error("API利用上限に達しています。時間をおいて再度お試しください。");
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error("APIキーが無効です。サーバー管理者に連絡してください。");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = (errorData as any)?.error?.message || `API通信エラー (${response.status})`;
      throw new Error(errorMessage);
    }

    const data = await response.json() as any;
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error("AIからの応答を取得できませんでした。");
    }

    // JSON応答のパース
    let jsonResult: unknown;
    try {
      // Markdownのバックチックが含まれている場合に対応
      const cleanedText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      jsonResult = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Raw text:", rawText);
      throw new Error("AIの応答形式が不正です。");
    }

    // 応答の検証
    const result = jsonResult as any;
    if (
      typeof result.verdict !== "string" &&
      result.verdict !== null &&
      !["可", "不可", "要確認"].includes(result.verdict)
    ) {
      throw new Error("verdictの値が不正です。");
    }

    return {
      verdict: result.verdict || null,
      summary: result.summary || "回答",
      answer: result.answer || "詳細な回答を取得できませんでした。",
      reference: result.reference || "厚生労働省ガイドライン",
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("不明なエラーが発生しました。");
  }
}
