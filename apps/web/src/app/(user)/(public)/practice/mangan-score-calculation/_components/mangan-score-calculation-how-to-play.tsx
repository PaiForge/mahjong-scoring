import { HaiKind } from "@mahjong-scoring/core";
import { QuestionDisplay } from "../../score/_components/question-display";
import { buildDemoScoreQuestion } from "../../_lib/demo-score-question";
import { YakuListDisplay } from "./yaku-list-display";

/**
 * デモ用の固定例: 立直 + 門前清自摸和 + 断么九 + 平和 + ドラ1 = 5翻（満貫）
 * 役と翻数が提示され、そこから点数を導く出題形式を示すため、ドラは手牌に乗る
 * 二萬（表示牌は一萬）にして5翻に届かせる。
 */
const DEMO_QUESTION = buildDemoScoreQuestion({
  doraMarkers: [HaiKind.ManZu1],
  isRiichi: true,
  yakuDetails: [
    { name: "立直", han: 1 },
    { name: "門前清自摸和", han: 1 },
    { name: "断么九", han: 1 },
    { name: "平和", han: 1 },
    { name: "ドラ", han: 1 },
  ],
});

/**
 * 満貫以上点数計算ドリルの「問題方式」ビジュアルデモ
 * 満貫以上点数計算 遊び方デモ
 *
 * 実際の出題盤面（手牌・状況・役一覧の提示）を静的に再現し、出題形式を端的に示す。
 */
export function ManganScoreCalculationHowToPlay() {
  return (
    <div className="space-y-4">
      <QuestionDisplay question={DEMO_QUESTION} />
      {DEMO_QUESTION.yakuDetails && (
        <YakuListDisplay yakuDetails={DEMO_QUESTION.yakuDetails} />
      )}
    </div>
  );
}
