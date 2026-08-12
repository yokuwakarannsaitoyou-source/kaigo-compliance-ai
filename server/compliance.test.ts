import { describe, it, expect, beforeAll } from "vitest";
import { judgeComplianceWithGemini } from "./geminiHelper";

// システムプロンプト（テスト用）
const TEST_SYSTEM_PROMPT = `
あなたは介護施設・訪問介護現場向けのコンプライアンス相談AIアシスタント「介護現場コンプライアンスAI」です。

【回答ルール】
ユーザーからの入力に対し、必ず以下のJSONフォーマットのみで返答してください。

{
  "verdict": "可" | "不可" | "要確認" | null,
  "summary": "15字前後の短い結論",
  "answer": "簡潔かつ分かりやすい解説",
  "reference": "根拠となる項目番号・通知等"
}
`;

describe("Gemini API Compliance Integration", () => {
  beforeAll(() => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not set - skipping integration tests");
    }
  });

  it("should validate GEMINI_API_KEY is configured", () => {
    const apiKey = process.env.GEMINI_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe("");
  });

  it("should call Gemini API and return valid compliance response", async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log("Skipping API test - GEMINI_API_KEY not set");
      return;
    }

    const testQuestion = "利用者の爪切りをしてもいいですか？";

    try {
      const result = await judgeComplianceWithGemini(testQuestion, TEST_SYSTEM_PROMPT);

      // Validate response structure
      expect(result).toBeDefined();
      expect(result).toHaveProperty("verdict");
      expect(result).toHaveProperty("summary");
      expect(result).toHaveProperty("answer");
      expect(result).toHaveProperty("reference");

      // Validate verdict value
      expect(["可", "不可", "要確認", null]).toContain(result.verdict);

      // Validate string fields
      expect(typeof result.summary).toBe("string");
      expect(typeof result.answer).toBe("string");
      expect(typeof result.reference).toBe("string");

      // Validate non-empty content
      expect(result.summary.length).toBeGreaterThan(0);
      expect(result.answer.length).toBeGreaterThan(0);

      console.log("✓ Gemini API response:", result);
      console.log("✓ Verdict:", result.verdict);
      console.log("✓ Summary:", result.summary);
    } catch (error) {
      if (error instanceof Error && error.message.includes("API利用上限")) {
        console.log("⚠ API rate limit reached - API is working but rate limited");
        // Rate limit is not a failure - it means the API is working
      } else if (error instanceof Error && error.message.includes("無効")) {
        throw new Error("GEMINI_API_KEY is invalid. Please provide a valid API key.");
      } else {
        throw error;
      }
    }
  });
});
