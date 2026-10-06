import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import type { ScoreTableUserAnswer } from "@mahjong-scoring/core";
import { type ScoreOptionRange } from "@mahjong-scoring/features/practice/score/get-available-scores";

import { Button } from "../../components/button";
import { useRuleSettingsStore } from "../../hooks/use-rule-settings-store";
import { colors } from "../../lib/theme";
import { useScoreAnswerForm } from "@mahjong-scoring/features/practice/score/use-score-answer-form";
import { ScoreOptionSelect } from "./score-option-select";

interface ScoreAnswerFormProps {
  /** 親かどうか */
  readonly isOya: boolean;
  /** ツモかどうか */
  readonly isTsumo: boolean;
  /** 翻数 */
  readonly han: number;
  readonly onSubmit: (answer: ScoreTableUserAnswer) => void;
  readonly disabled?: boolean;
  /** i18n の翻訳ネームスペース */
  readonly translationNamespace: string;
  /**
   * 正誤フィードバック表示中か（セッションから受け取る）。
   * 回答した選択欄の枠と地を正誤の色にする。
   */
  readonly showFeedback?: boolean;
  /** 直前の回答が正解だったか（未回答・無回答の正解開示中は undefined） */
  readonly lastAnswerCorrect?: boolean;
  /**
   * 点数の選択肢をこの範囲に固定する（省略時は翻数から絞る）。
   * 出題が範囲を固定している練習（昇級試験）が渡す。
   */
  readonly scoreRange?: ScoreOptionRange;
  /**
   * 選択完了時に自動送信する（「回答する」ボタンを押さずに送信扱いにする）
   * 選択即送信
   *
   * 単一選択は値が選ばれた時点、子ツモは 2 つとも選ばれた時点で送信する。
   * 有効時は送信ボタンを表示しない。選択欄は 1 つの値しか持てず、選び直しも
   * 送信前に済むため、確定のボタンは「同じ答えをもう一度言う」だけの 1 タップに
   * なる（web の同名 prop と同じ理由。点数を選んで答える盤面はすべて有効）。
   */
  readonly autoSubmit?: boolean;
  /**
   * ダブル役満を採用したルールでの出題か。採用時はダブル役満の点数
   * （子64000点等）を選択肢に足す（既定 false）。
   */
  readonly allowDoubleYakuman?: boolean;
  /**
   * 選択肢を端末のルール設定（切り上げ満貫・ダブル役満）に依らない集合に
   * 固定する（既定 false）
   * ルール固定
   *
   * チャレンジと昇級試験が立てる。設定で選択肢の個数が変わると同じ土俵の
   * 中で有利不利が出るため（features の `challenge/rule-boundary.ts`）。
   * true のとき `allowDoubleYakuman` は無視され、切り上げ満貫も無効として絞り込む。
   */
  readonly fixedRules?: boolean;
}

/**
 * 点数系練習共通の回答フォーム
 * 点数回答フォーム
 *
 * web の `ScoreAnswerForm` の移植。点数のみを選択欄で回答する。翻・符・
 * 親子・ツモロンの判定は呼び出し元が行う。回答直後は選択欄自身の枠と地の
 * 色で正誤を返し、正解の点数は出さない（トレーニングでは
 * {@link import("./revealed-score-answer").RevealedScoreAnswer} が別に出す）。
 *
 * @remarks
 * 問題が変わったときの入力リセットは、呼び出し元が `key` に問題の識別子を
 * 渡して再マウントさせることで行う。
 */
export function ScoreAnswerForm({
  isOya,
  isTsumo,
  han,
  onSubmit,
  disabled = false,
  translationNamespace,
  scoreRange,
  autoSubmit = false,
  showFeedback = false,
  lastAnswerCorrect,
  allowDoubleYakuman = false,
  fixedRules = false,
}: ScoreAnswerFormProps) {
  const t = useTranslations(translationNamespace);
  const kiriageMangan = useRuleSettingsStore((s) => s.kiriageMangan);
  const {
    availableScores,
    isOyaTsumo,
    score,
    scoreFromKo,
    scoreFromOya,
    selectScore,
    selectFromKo,
    selectFromOya,
    isComplete,
    submit,
    showsSubmitButton,
  } = useScoreAnswerForm({
    isOya,
    isTsumo,
    han,
    onSubmit,
    disabled,
    scoreRange,
    autoSubmit,
    kiriageMangan,
    allowDoubleYakuman,
    fixedRules,
  });
  // 子ツモの 2 つの欄は片方だけを染めない。正誤判定は
  // 「子から / 親から」を合わせた 1 つの回答に対して下るため
  const feedback = { showFeedback, lastAnswerCorrect };

  return (
    <View style={styles.form}>
      {availableScores.type === "koTsumo" ? (
        <View style={styles.koTsumoRow}>
          <View style={styles.koTsumoColumn}>
            <Text style={styles.label}>{t("fromKo")}</Text>
            <ScoreOptionSelect
              value={scoreFromKo}
              onChange={selectFromKo}
              options={availableScores.koScores}
              placeholder={t("selectScore")}
              accessibilityLabel={t("fromKo")}
              disabled={disabled}
              feedback={feedback}
              testID="score-select-from-ko"
            />
          </View>
          <Text style={styles.slash}>/</Text>
          <View style={styles.koTsumoColumn}>
            <Text style={styles.label}>{t("fromOya")}</Text>
            <ScoreOptionSelect
              value={scoreFromOya}
              onChange={selectFromOya}
              options={availableScores.oyaScores}
              placeholder={t("selectScore")}
              accessibilityLabel={t("fromOya")}
              disabled={disabled}
              feedback={feedback}
              testID="score-select-from-oya"
            />
          </View>
        </View>
      ) : (
        <View>
          <Text style={styles.label}>{t("selectScore")}</Text>
          <ScoreOptionSelect
            value={score}
            onChange={selectScore}
            options={availableScores.scores}
            placeholder={t("selectScore")}
            disabled={disabled}
            optionSuffix={isOyaTsumo ? t("all") : ""}
            feedback={feedback}
            testID="score-select"
          />
        </View>
      )}

      {/* 自動送信時は「回答する」ボタンを表示しない（選択完了で送信扱い） */}
      {showsSubmitButton && (
        <Button
          onPress={submit}
          size="lg"
          fullWidth
          disabled={disabled || !isComplete}
        >
          {t("answer")}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  koTsumoRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  koTsumoColumn: {
    flex: 1,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface700,
  },
  slash: {
    paddingBottom: 14,
    fontSize: 16,
    fontWeight: "500",
    color: colors.surface500,
  },
});
