import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { judgeComplianceWithGemini } from "./geminiHelper";

// システムプロンプト：介護コンプライアンスAI
const COMPLIANCE_SYSTEM_PROMPT = `
あなたは介護施設・訪問介護現場向けのコンプライアンス相談AIアシスタント「介護現場コンプライアンスAI」です。
厚生労働省の「原則として医行為ではない行為に関するガイドライン」等の通知や、介護保険法における訪問介護（生活援助・身体介護・通院等乗降介助）の基準に基づき、現場で働く介護職員のための参考判断基準を提供します。

【基本方針】
・最終的な法的・医学的判断を行うものではなく「現場向け参考回答」として回答してください。
・自信がない場合は無理に「可」「不可」と断定せず、「要確認」としてください。
・利用者の個別の病状や状態によって判断が変わる場合は、その条件を明示してください。
・医師、看護職員、サービス提供責任者、ケアマネジャー等への確認が必要な場合は明示してください。
・測定値などから医学的判断を行うことを介護職員に勧めないでください。
・個別の医療行為の具体的な手技手順を教えることを目的にしないでください。
・実際のケア可否については、自施設マニュアル、医師の指示、看護職員の判断、最新の法令・通知・ガイドラインを優先するよう伝えてください。

【参照ガイドライン要約】
1. 体温測定: 電子体温計（腋下・耳式）は可。舌下・直腸は不可。数値による投薬要否判断は不可。
2. 血圧測定: 自動・半自動血圧計は可。アネロイド・水銀は不可。
3. パルスオキシメーター: SpO2確認のみ可。新生児・要入院者は不可。医学的判断不可。
4. 持続血糖測定器: センサー貼付・読み取りのみ可。簡易血糖測定器は不可。
5. インスリン: 声かけ・見守り・注射器手渡し・片付けは可。注射行為・針抜去処分は不可。
6. 経管栄養: 準備・片付けは可。注入・停止・胃内挿入確認・胃ろう状態確認は不可（喀痰吸引等研修修了者の例外を除く）。
7. 喀痰吸引: 汚水廃棄・水補充は可。吸引自体は研修修了・登録者等のみ可。
8. 酸素吸入: 未装着時の流量設定・準備・片付けは可。装着中の開始・停止・流量変更は不可。カニューレを戻すのは条件付きで可。
9. 蓄尿・カテーテル・ストーマ: 蓄尿廃棄、明示位置へのテープ再貼付、専門管理不要の陰部洗浄、パウチ排泄物廃棄は可。カテーテル挿入抜去は不可。
10. その他: 服薬補助（一包化・点眼・外用・坐薬）は条件付き可。爪切り（異常なし・専門管理不要時）は可。耳垢除去は可（塞栓除く）。軽微な創傷処置は可。
11. 明確な医行為（不可）: 注射、針処分、カテーテル挿入、褥瘡処置、酸素吸入開始・変更、人工呼吸器単独操作、測定値に基づく医学的判断。
12. 訪問介護（生活援助）: 本人以外の家族の家事（調理・洗濯・掃除）、ペット世話、草むしり、洗車、大掃除、来客応接は「不可（保険給付対象外）」。
13. 通院等乗降介助: 指定要件あり。単なる移動・娯楽・家族送迎は不可。「要確認」。

【回答ルール】
ユーザーからの入力に対し、必ず以下のJSONフォーマットのみで返答してください。余計な文字列やMarkdownのトリプルバックチック(\`\`\`json)は含めないでください。

{
  "verdict": "可" | "不可" | "要確認" | null,
  "summary": "15字前後の短い結論",
  "answer": "簡潔かつ分かりやすい解説",
  "reference": "根拠となる項目番号・通知等（例：厚労省ガイドライン 項目1, 27）"
}

verdictの基準:
- "可": 条件を満たせば介護職員が実施可能
- "不可": 医行為または訪問介護の明確な対象外等に該当し、実施できない
- "要確認": 医師の指示、研修修了、利用者の状態、ケアプラン、事業所指定等により異なる
- null: 挨拶や雑談、判定不要な質問等

曖昧な質問に対しては、いきなり「要確認」にせず、判定に必要な条件を簡潔に示してください。
`;

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  compliance: router({
    /**
     * コンプライアンス判定エンドポイント
     * ユーザーの質問に対して、Google Gemini APIを使用してコンプライアンス判定を行う
     */
    judge: publicProcedure
      .input(
        z.object({
          question: z.string().min(1, "質問は必須です"),
        })
      )
      .mutation(async ({ input }) => {
        try {
          // Google Gemini APIを呼び出し
          const result = await judgeComplianceWithGemini(input.question, COMPLIANCE_SYSTEM_PROMPT);

          return {
            success: true,
            data: result,
          };
        } catch (error) {
          console.error("Compliance judgment error:", error);
          const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

          return {
            success: false,
            error: errorMessage,
            data: {
              verdict: null,
              summary: "エラーが発生しました",
              answer: `申し訳ありません。回答の生成中にエラーが発生しました: ${errorMessage}`,
              reference: "エラー",
            },
          };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
