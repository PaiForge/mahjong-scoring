import { getTranslations } from "next-intl/server";

import { QuestionPrompt } from "@/app/(user)/(public)/practice/_components/question-prompt";
import type { DemoScoreQuestionOptions } from "@/app/(user)/(public)/practice/_lib/demo-score-question";
import { buildDemoScoreQuestion } from "@/app/(user)/(public)/practice/_lib/demo-score-question";
import { QuestionDisplay } from "@/app/(user)/(public)/practice/score/_components/question-display";

interface ScoreExamHowToPlayConfig extends DemoScoreQuestionOptions {
  /** i18n の翻訳ネームスペース（例: "manganExamChallenge"） */
  readonly translationNamespace: string;
}

/**
 * 昇級試験（点数計算）の「問題方式」ビジュアルデモを生成するファクトリー関数
 * 昇級試験 遊び方デモ生成
 *
 * 実際の出題盤面（手牌・状況のみ）を出題時のまま静的に再現し、その下に
 * 出題文を置く。級ごとに違うのはデモの牌姿と翻訳ネームスペースだけで、
 * 構図はどの級も同じなのでここ 1 箇所で組む。各級の
 * `_components/<級>-exam-how-to-play.tsx` はこの関数を呼ぶだけになり、
 * そのファイルの TSDoc が「なぜその牌姿を選んだか」を書く場所になる。
 *
 * どの級も役一覧を表示しない（`yakuDetails` を渡さない）。受験者が手牌から
 * 翻数を自力で数えるのが試験の要件であり、役を出すと最初の判断を肩代わり
 * してしまうため。これは出題盤面（{@link createScoreExamBoard}）と同じ方針で、
 * デモが実物と違う見え方をしないように揃えている。
 *
 * 符を選択肢から選ぶ試験（手牌の合計符）はこの構図に乗らない。盤面が
 * `QuestionDisplay` ではなく手牌と符の選択肢で、デモも選択肢まで見せる
 * 必要があるため、そちらは専用のコンポーネントのまま置いている。
 */
export function createScoreExamHowToPlay(config: ScoreExamHowToPlayConfig) {
  const { translationNamespace, ...demoOptions } = config;
  const question = buildDemoScoreQuestion(demoOptions);

  return async function ScoreExamHowToPlay() {
    const t = await getTranslations(translationNamespace);

    return (
      <div className="space-y-4">
        <QuestionDisplay question={question} />

        <QuestionPrompt>{t("questionPrompt")}</QuestionPrompt>
      </div>
    );
  };
}
