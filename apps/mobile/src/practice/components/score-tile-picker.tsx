import { useState } from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useTranslations } from "use-intl";
import type { ScoreRange } from "@mahjong-scoring/core";
import type { SingleInputScores } from "@mahjong-scoring/features/practice/score/get-available-scores";
import {
  resolveScoreTileBands,
  SCORE_BANDS,
} from "@mahjong-scoring/features/practice/score/score-tile-bands";

import { Grid } from "../../components/grid";
import { InsetRing } from "../../components/inset-ring";
import { PressableSurface } from "../../components/pressable-surface";
import { ToggleGroup } from "../../components/toggle-group";
import { borderWidth, colors, radius } from "../../lib/theme";
import { choiceFeedbackStyle } from "../feedback-styles";

/** 回答直後にタイルが返す正誤（`ScoreOptionSelect` と同じ形） */
interface TileFeedbackState {
  readonly showFeedback: boolean;
  readonly lastAnswerCorrect: boolean | undefined;
}

interface ScoreTilePickerProps {
  /** 選択肢（子ツモは組の `koTsumoCombined` だけを受ける） */
  readonly available: SingleInputScores;
  readonly isOya: boolean;
  readonly isTsumo: boolean;
  /**
   * 選んだ選択肢の値（`ScoreSelectOption.value`。点数は `"1000"`、子ツモの組は
   * `"300/500"`）。未選択は undefined
   */
  readonly value: string | undefined;
  readonly onChange: (value: string) => void;
  /** 各点数の後置文字列（親ツモの「オール」） */
  readonly suffix?: string;
  readonly disabled?: boolean;
  /** 読み上げ用の名前（欄の見出し） */
  readonly accessibilityLabel: string;
  /**
   * 選んだ時点で送信されるか。送信されるなら選んだタイルを採点待ちの灰で、
   * 「回答する」ボタンで送るなら選択中の墨で示す
   */
  readonly autoSubmit?: boolean;
  /** 回答直後の正誤（正誤を返さない画面では省略する） */
  readonly feedback?: TileFeedbackState;
  /**
   * Maestro のフローで引く印。切り替えは `<testID>-band-<帯>`、タイルは
   * `<testID>-<値>`
   */
  readonly testID?: string;
}

/** タイルの高さと行間（web の `min-h-11` / `gap-1.5`） */
const TILE_HEIGHT = 44;
const TILE_GAP = 6;

/**
 * 点数をタイルで答える欄（web の `ScoreTilePicker`）
 * 点数タイル入力
 *
 * 選択欄では選択肢が多すぎる（子ロンの全範囲で 30 個）ため、「満貫未満 /
 * 満貫以上」の切り替え（{@link ToggleGroup}）で片側だけを並べる。どちらの帯を
 * 開くか・切り替えを出すか・隠れた側の選択・確保する行数は features の
 * {@link resolveScoreTileBands}（web と共通）が決め、ここは描画だけを持つ。
 *
 * 両側のタイル群のうち多いほうの高さを確保し、切り替えで下の「回答する」
 * ボタンが上下に動かないようにする。選択中は `InsetRing` + 墨の枠（塗りだけに
 * 頼らない）、回答直後は選んだタイルを正誤の色にして他を薄くする
 * （選択肢ボタンと同じ `choiceFeedbackStyle`）。
 */
export function ScoreTilePicker({
  available,
  isOya,
  isTsumo,
  value,
  onChange,
  suffix = "",
  disabled = false,
  accessibilityLabel,
  autoSubmit = false,
  feedback,
  testID = "score-tiles",
}: ScoreTilePickerProps) {
  const t = useTranslations("practice.scoreInput");
  const [chosenBand, setChosenBand] = useState<ScoreRange | undefined>();

  const { options, hasBoth, band, hiddenSelection, columns, rows } =
    resolveScoreTileBands({
      available,
      isOya,
      isTsumo,
      value,
      chosenBand,
      suffix,
    });

  const showsFeedback =
    feedback !== undefined &&
    feedback.showFeedback &&
    feedback.lastAnswerCorrect !== undefined;

  const tileStyle = (isSelected: boolean): ViewStyle => {
    if (showsFeedback) {
      return choiceFeedbackStyle(
        true,
        isSelected,
        isSelected && feedback.lastAnswerCorrect === true,
      );
    }
    if (!isSelected) return styles.tileIdle;
    return autoSubmit ? styles.tilePending : styles.tileSelected;
  };

  return (
    <View
      style={styles.root}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {hasBoth && (
        <ToggleGroup
          groups={[
            SCORE_BANDS.map((b) => ({
              value: b,
              label:
                hiddenSelection?.band === b
                  ? `${t(b)} · ${hiddenSelection.label}`
                  : t(b),
            })),
          ]}
          selected={band}
          onSelect={setChosenBand}
          accessibilityLabel={t("bands")}
          fill
          size="lg"
          disabled={disabled}
          testID={`${testID}-band`}
        />
      )}
      <View
        style={{
          minHeight: rows * TILE_HEIGHT + (rows - 1) * TILE_GAP,
        }}
      >
        <Grid columns={columns} gap={TILE_GAP}>
          {options[band].map((option) => {
            const isSelected = option.value === value;
            return (
              <PressableSurface
                key={option.value}
                onPress={() => onChange(option.value)}
                disabled={disabled}
                accessibilityLabel={option.label}
                accessibilityState={{ selected: isSelected }}
                testID={`${testID}-${option.value}`}
                style={[styles.tile, tileStyle(isSelected)]}
                pressedStyle={styles.tilePressed}
              >
                {isSelected && !showsFeedback && !autoSubmit && (
                  <InsetRing color={colors.selected} borderRadius={radius.sm} />
                )}
                <Text style={styles.tileLabel}>{option.label}</Text>
              </PressableSurface>
            );
          })}
        </Grid>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 12,
  },
  tile: {
    minHeight: TILE_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: borderWidth.panel,
    borderRadius: radius.sm,
  },
  tileIdle: {
    borderColor: colors.surface300,
    backgroundColor: colors.white,
  },
  tileSelected: {
    borderColor: colors.selected,
    backgroundColor: colors.selectedSubtle,
  },
  tilePending: {
    borderColor: colors.pendingBorder,
    backgroundColor: colors.pending,
  },
  tilePressed: {
    borderColor: colors.surface400,
    backgroundColor: colors.surface50,
  },
  tileLabel: {
    fontSize: 15,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    color: colors.surface900,
  },
});
