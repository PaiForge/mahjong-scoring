import { getTranslations } from "next-intl/server";
import { HaiKind } from "@mahjong-scoring/core";
import { QuestionDisplay } from "@/app/(user)/(public)/practice/score/_components/question-display";
import { QuestionPrompt } from "@/app/(user)/(public)/practice/_components/question-prompt";
import { buildDemoScoreQuestion } from "@/app/(user)/(public)/practice/_lib/demo-score-question";

/**
 * デモ用の固定例: 立直 + 門前清自摸和 + 断么九 + 平和 + ドラ1 = 5翻（満貫）
 * 満貫以上ドリルと同じ手牌だが、試験では役一覧を提示しないため
 * `yakuDetails` は渡さない（受験者が数える側の情報だから）。
 */
const DEMO_QUESTION = buildDemoScoreQuestion({
  doraMarkers: [HaiKind.ManZu1],
  isRiichi: true,
});

/**
 * 昇級試験（満貫以上の点数計算）の「問題方式」ビジュアルデモ
 * 昇級試験 遊び方デモ
 *
 * 実際の出題盤面（手牌・状況のみ。役一覧なし）を静的に再現し、
 * 「翻数は自分で数える」出題形式を端的に示す。
 */
export async function ManganExamHowToPlay() {
  const t = await getTranslations("manganExamChallenge");

  return (
    <div className="space-y-4">
      <QuestionDisplay question={DEMO_QUESTION} />

      <QuestionPrompt>{t("questionPrompt")}</QuestionPrompt>
    </div>
  );
}
