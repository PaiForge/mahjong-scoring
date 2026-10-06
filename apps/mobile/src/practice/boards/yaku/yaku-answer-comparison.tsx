import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import { buildYakuComparisonChips } from "@mahjong-scoring/features/practice/yaku/answer-comparison";
import { AnswerOutcome } from "@mahjong-scoring/features/results/result-schemas";

import { useYakuLabel } from "@mahjong-scoring/features/yaku/use-yaku-options";
import { useYakuOrder } from "../../../hooks/use-yaku-order-store";
import { AnswerComparison } from "../../components/answer-comparison";
import { YakuChip } from "./yaku-chip";

/**
 * 役選択の答え合わせ（成立していた役 / あなたの回答の対比。web の `YakuAnswerComparison`）
 * 役答え合わせ
 *
 * トレーニングの停止中と結果画面の問題別一覧で共有する。チップの状態は
 * core の `judgeYakuName` が決め、選べた役は緑、選び忘れは黄、余分に選んだ
 * 役は赤になる。時間切れは比べる回答が無いので、成立していた役を緑で出す。
 */
export function YakuAnswerComparison({
  correctYakuNames,
  selectedYakuNames,
  outcome,
}: {
  readonly correctYakuNames: readonly string[];
  /** ユーザーが選んだ役。時間切れで答えられなかった問題では undefined */
  readonly selectedYakuNames: readonly string[] | undefined;
  /** 1 問の顛末。無回答のまま開示したときは undefined（正誤の色を出さない） */
  readonly outcome: AnswerOutcome | undefined;
}) {
  const t = useTranslations("yaku");
  const labelOf = useYakuLabel();
  const yakuOrder = useYakuOrder();

  /** 役名を表示順に並べてチップにする（選択順・判定順のばらつきを見せない） */
  const chips = (names: readonly string[]) => {
    const ordered = buildYakuComparisonChips(
      names,
      yakuOrder,
      correctYakuNames,
      selectedYakuNames,
      outcome,
    );
    if (ordered.length === 0) return t("result.none");

    return (
      <View style={styles.chips}>
        {ordered.map(({ yakuName, state }) => (
          <YakuChip
            key={yakuName}
            label={labelOf(yakuName)}
            feedbackState={state}
          />
        ))}
      </View>
    );
  };

  return (
    <AnswerComparison
      translationNamespace="yaku"
      outcome={outcome}
      correct={chips(correctYakuNames)}
      user={selectedYakuNames && chips(selectedYakuNames)}
    />
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 6,
  },
});
