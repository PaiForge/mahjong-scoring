import { getTranslations } from "next-intl/server";
import { HaiKind } from "@mahjong-scoring/core";
import { QuestionDisplay } from "@/app/(user)/(public)/practice/score/_components/question-display";
import { QuestionPrompt } from "@/app/(user)/(public)/practice/_components/question-prompt";
import { buildDemoScoreQuestion } from "@/app/(user)/(public)/practice/_lib/demo-score-question";

/**
 * デモ用の固定例: 平和 + 断么九 + 門前清自摸和 = 3翻20符
 * 共通のデモ牌姿がそのまま平和の教科書的な形（順子4つ + 中張牌の雀頭 +
 * 両面待ち）なので流用する。ドラ表示牌を一索にして手牌に乗らないように
 * している（乗せると翻数が上がり、満貫未満という出題条件から外れやすい）。
 * 試験では役一覧を提示しないため `yakuDetails` は渡さない。
 */
const DEMO_QUESTION = buildDemoScoreQuestion({
  doraMarkers: [HaiKind.SouZu1],
  isRiichi: false,
});

/**
 * 昇級試験（平和の点数計算）の「問題方式」ビジュアルデモ
 * 昇級試験 遊び方デモ
 *
 * 実際の出題盤面（手牌・状況のみ。役一覧なし）を静的に再現し、
 * 「翻数は自分で数え、符はツモ20符・ロン30符」という出題形式を端的に示す。
 */
export async function PinfuExamHowToPlay() {
  const t = await getTranslations("pinfuExamChallenge");

  return (
    <div className="space-y-4">
      <QuestionDisplay question={DEMO_QUESTION} />

      <QuestionPrompt>{t("questionPrompt")}</QuestionPrompt>
    </div>
  );
}
