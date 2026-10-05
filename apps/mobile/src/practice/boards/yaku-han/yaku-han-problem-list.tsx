import { useTranslations } from "use-intl";
import { isYakuman } from "@mahjong-scoring/features/practice/yaku-han/han-options";
import type { YakuHanQuestionResult } from "@mahjong-scoring/features/practice/yaku-han/types";

import { AnswerComparison } from "../../components/answer-comparison";
import { ProblemListAccordion } from "../../components/problem-list-accordion";

/**
 * 役翻数練習の問題別一覧（web の `YakuHanProblemList`）
 * 役翻数問題一覧
 *
 * 役名と門前 / 鳴きは見出しの要約が出すため、展開後は正解とユーザー回答の
 * 対比だけを見せる。
 */
export function YakuHanProblemList({
  results,
}: {
  readonly results: readonly YakuHanQuestionResult[];
}) {
  const t = useTranslations("yakuHanChallenge");

  const hanLabel = (han: number) =>
    isYakuman(han) ? t("yakuman") : t("hanOption", { count: han });

  // 門前限定役も含め常に付ける（出題時のバッジと表示を揃える）
  const stateLabel = (r: YakuHanQuestionResult) =>
    `（${r.isMenzen ? t("menzen") : t("naki")}）`;

  return (
    <ProblemListAccordion
      results={results}
      translationNamespace="yakuHanChallenge"
      outcome={(r) => r.outcome}
      renderSummary={(r) => `${r.yakuName}${stateLabel(r)}`}
      renderDetail={({ correctHan, userHan, outcome }) => (
        <AnswerComparison
          translationNamespace="yakuHanChallenge"
          outcome={outcome}
          correct={hanLabel(correctHan)}
          user={userHan === undefined ? undefined : hanLabel(userHan)}
          difference={
            userHan === undefined
              ? undefined
              : {
                  correct: correctHan,
                  user: userHan,
                  format: (value) => t("hanOption", { count: value }),
                }
          }
        />
      )}
    />
  );
}
