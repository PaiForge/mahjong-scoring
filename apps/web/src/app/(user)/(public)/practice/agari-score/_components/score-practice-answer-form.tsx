"use client";

import { useTranslations } from "next-intl";
import { allowsDoubleYakuman } from "@mahjong-scoring/core";
import { YakuLabelRow, YakuSelect } from "./yaku-select";
import {
  useRuleSettingsStore,
  useYakumanRules,
} from "@/app/_hooks/use-rule-settings-store";
import {
  useKoTsumoInput,
  useScoreInput,
} from "@/app/_hooks/use-display-settings-store";
import type { ScorePracticeAnswerFormProps } from "@mahjong-scoring/features/practice/score/score-practice-answer-form-props";
import { useScorePracticeAnswerForm } from "@mahjong-scoring/features/practice/score/use-score-practice-answer-form";
import { Button } from "@/app/(user)/_components/button";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { AGARI_SCORE_TOUR_ID } from "../_lib/tour-ids";
import { HanFuFields } from "./han-fu-fields";
import { ScoreField } from "./score-field";

/**
 * 回答フォームコンポーネント
 * 回答フォーム
 *
 * props の意味（判定モード・役なし・読み込んでおく回答）は features の
 * {@link ScorePracticeAnswerFormProps}。
 * 各欄には和了形の点数計算のヘルプツアーが照らす印（`AGARI_SCORE_TOUR_ID`）を付ける。
 * 聴牌形の点数計算もこのフォームを使うが、そちらのツアーはフォーム全体を
 * 1 つの対象として照らすので、欄ごとの印は引かれない。
 */
export function ScorePracticeAnswerForm({
  onSubmit,
  disabled = false,
  isTsumo,
  isOya,
  requireYaku = false,
  requireHanFu = true,
  exactHan = false,
  requireFuForMangan = false,
  submitLabel,
  autoSubmit = false,
  reserveYakuRow = false,
  noYaku,
  prefill,
}: ScorePracticeAnswerFormProps) {
  const t = useTranslations("agariScore");
  const kiriageMangan = useRuleSettingsStore((s) => s.kiriageMangan);
  // ダブル役満を採用したルールでは、翻数・点数の選択肢にダブル役満を足す
  const allowDoubleYakuman = allowsDoubleYakuman(useYakumanRules());
  const storedKoTsumoInput = useKoTsumoInput();
  const scoreInput = useScoreInput();
  // タイルは子ツモを常に組で答える（2 つのタイル群は帯を決められない）
  const koTsumoInput = scoreInput === "tiles" ? "combined" : storedKoTsumoInput;
  // 点数だけを問う設定のときだけ選んだ時点で送る（他の欄があると、点数が
  // 最後の欄とは限らない）
  const submitsOnSelect = autoSubmit && !requireYaku && !requireHanFu;
  const form = useScorePracticeAnswerForm({
    onSubmit,
    isTsumo,
    isOya,
    requireYaku,
    requireHanFu,
    requireFuForMangan,
    kiriageMangan,
    allowDoubleYakuman,
    koTsumoInput,
    autoSubmit: submitsOnSelect,
    prefill,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    form.submit();
  };

  // 「役なし」はロンにしか無い回答なので、「役」のラベル行の右端に添える
  // （渡されたときだけ）。リンク風のボタンで、押した瞬間に回答が確定する。
  // 役の回答が不要な設定でも reserveYakuRow ならラベル行だけを出し、ツモと
  // ロンでフォームの高さが変わらないようにする
  const noYakuButton = noYaku && (
    <button
      type="button"
      disabled={disabled}
      onClick={noYaku.onSelect}
      className={`text-xs ${TEXT_LINK_CLASSES}`}
    >
      {noYaku.label}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {requireYaku ? (
        <div data-tour-id={AGARI_SCORE_TOUR_ID.yaku}>
          <YakuSelect
            value={form.yakus}
            onChange={form.setYakus}
            disabled={disabled}
            labelAction={noYakuButton}
          />
        </div>
      ) : (
        reserveYakuRow && <YakuLabelRow action={noYakuButton} />
      )}

      {/* 翻数と符を問わない設定では欄ごと出さない（実戦では点数だけを申告する）。
          点数の選択肢は翻数で絞られず、取りうる全点数になる */}
      {requireHanFu && (
        <HanFuFields
          form={form}
          exactHan={exactHan}
          allowDoubleYakuman={allowDoubleYakuman}
          disabled={disabled}
        />
      )}

      <ScoreField
        form={form}
        disabled={disabled}
        scoreInput={scoreInput}
        isOya={isOya}
        isTsumo={isTsumo}
        autoSubmit={submitsOnSelect}
      />

      {/* 選択即送信なら出さない（選んだ時点で送られる） */}
      {form.showsSubmitButton && (
        <Button
          type="submit"
          size="lg"
          fullWidth
          disabled={disabled || !form.isComplete}
          data-tour-id={AGARI_SCORE_TOUR_ID.submit}
        >
          {submitLabel ?? t("form.buttons.answer")}
        </Button>
      )}
    </form>
  );
}
