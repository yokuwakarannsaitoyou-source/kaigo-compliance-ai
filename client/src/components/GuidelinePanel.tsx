import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, AlertCircle } from "lucide-react";

const GUIDELINES = [
  {
    id: "medical-acts",
    title: "医行為の基本定義",
    content:
      "医師の医学的判断及び技術をもってするのでなければ人体に危害を及ぼすおそれのある行為（医師法17条）。無免許での反復継続は違法となり得ます。",
  },
  {
    id: "vital-signs",
    title: "バイタル測定",
    content:
      "腋下・耳式体温計、自動/半自動血圧計、パルスオキシメーター（SpO2）測定は原則可。ただし測定値からの医学的判断や投薬要否の決定は不可。",
  },
  {
    id: "blood-glucose",
    title: "血糖値・インスリン",
    content:
      "持続血糖測定器の数値読み取り、注射器の手渡し・準備・片付け・声かけは可。注射行為自体、針の抜去・処分、簡易血糖測定器による測定は不可。",
  },
  {
    id: "nutrition",
    title: "経管栄養・喀痰吸引",
    content:
      "準備や汚水廃棄は可。注入・停止・胃内確認、吸引行為自体は、所定の研修を修了し認定特定行為業務従事者として登録された職員を除き不可。",
  },
  {
    id: "medication",
    title: "服薬介助・外用薬",
    content:
      "一包化された内服薬、点眼薬、湿布、軟膏塗布、肛門坐薬挿入は一定の条件下で可。",
  },
  {
    id: "nail-care",
    title: "爪切り・耳垢・スキンケア",
    content:
      "爪・周囲皮膚に異常がなく糖尿病等の専門的管理が不要な場合の爪切りは可。耳垢除去は可（耳垢塞栓除く）。軽微な切り傷・擦り傷の処置は可。",
  },
  {
    id: "home-care",
    title: "訪問介護（生活援助）",
    content:
      "本人以外の同居家族のための調理・洗濯・掃除、洗車、ペットの世話、草むしり、大掃除などは介護保険給付の対象外（不可）。",
  },
  {
    id: "transportation",
    title: "通院等乗降介助",
    content:
      "自家用車等での送迎は事業所の指定やケアプランへの位置づけが必要。家族の同乗や単なる娯楽目的の送迎は対象外。",
  },
];

export function GuidelinePanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-900">
          <p className="font-semibold mb-1">重要なお知らせ</p>
          <p>
            このAIの回答は参考情報です。最終的な判断は、医師、看護職員、サービス提供責任者、ケアマネジャー等の専門家に確認してください。
          </p>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-gray-700" />
          <h3 className="font-semibold text-gray-900">参考ガイドライン</h3>
        </div>

        <Tabs defaultValue="medical-acts" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-1 h-auto p-1">
            {GUIDELINES.map((guideline) => (
              <TabsTrigger
                key={guideline.id}
                value={guideline.id}
                className="text-xs py-2 px-1 data-[state=active]:bg-blue-600"
              >
                {guideline.title.split("・")[0]}
              </TabsTrigger>
            ))}
          </TabsList>

          {GUIDELINES.map((guideline) => (
            <TabsContent key={guideline.id} value={guideline.id} className="mt-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">{guideline.title}</h4>
                <p className="text-sm text-gray-700 leading-relaxed">{guideline.content}</p>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </div>
  );
}
