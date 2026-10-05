import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  allowsDoubleYakuman,
  FU_VALUES,
  paymentKindOf,
  YAKUMAN_HAN,
} from "@mahjong-scoring/core";
import type { UserAnswer } from "@mahjong-scoring/core";
import { getAvailableScores } from "@mahjong-scoring/features/practice/score/get-available-scores";
import {
  MANGAN_MIN_HAN,
  practiceHanTiers,
} from "@mahjong-scoring/features/practice/score/han-tiers";

import { Button } from "../../../components/button";
import {
  SelectField,
  type SelectOption,
} from "../../../components/select-field";
import {
  useRuleSettingsStore,
  useYakumanRules,
} from "../../../hooks/use-rule-settings-store";
import { colors } from "../../../lib/theme";
import { ScoreOptionSelect } from "../../components/score-option-select";
import { YakuLabelRow, YakuSelect } from "./yaku-select";

interface ScorePracticeAnswerFormProps {
  readonly onSubmit: (answer: UserAnswer) => void;
  readonly disabled?: boolean;
  readonly isTsumo: boolean;
  readonly isOya: boolean;
  readonly requireYaku?: boolean;
  readonly simplifyMangan?: boolean;
  readonly requireFuForMangan?: boolean;
  /** 回答ボタンの文言。既定は「回答する」 */
  readonly submitLabel?: string;
  /**
   * 「役」のラベル行を役の回答が不要でも出す。「役なし」のボタンの置き場を
   * ツモ・ロンの別によらず確保し、フォームの高さを変えないため
   * （待ち別点数計算が立てる）
   */
  readonly reserveYakuRow?: boolean;
  /**
   * 「役なし（ロンできない）」を回答として選べるようにする。押した時点で
   * `onSelect` を呼び、回答ボタンを経由させない（理由は web の同名 prop）
   */
  readonly noYaku?: {
    readonly label: string;
    readonly onSelect: () => void;
  };
  /**
   * 入力欄に読み込んでおく回答。まだ何も入力していない間だけ効く
   * （待ち別点数計算で回答済みのマスを選択に加えたとき。web の同名 prop）
   */
  readonly prefill?: UserAnswer;
}

/** 入力欄の中身（prefill から起こすため 1 つの型にまとめる） */
interface FormFields {
  readonly han: number | undefined;
  readonly fu: number | undefined;
  readonly yakus: readonly string[];
  readonly score: number | undefined;
  readonly scoreFromKo: number | undefined;
  readonly scoreFromOya: number | undefined;
}

const EMPTY_FIELDS: FormFields = {
  han: undefined,
  fu: undefined,
  yakus: [],
  score: undefined,
  scoreFromKo: undefined,
  scoreFromOya: undefined,
};

function fieldsOf(prefill: UserAnswer | undefined): FormFields {
  if (!prefill) return EMPTY_FIELDS;
  return {
    han: prefill.han,
    fu: prefill.fu,
    yakus: prefill.yakus,
    score: prefill.score,
    scoreFromKo: prefill.scoreFromKo,
    scoreFromOya: prefill.scoreFromOya,
  };
}

/**
 * 点数計算の無限訓練の回答フォーム（web の `ScorePracticeAnswerForm`）
 * 回答フォーム
 *
 * 役（設定で求めるとき）・翻数・符・点数を選んで回答する。満貫以上で符が
 * 不要になっても符の欄は消さず無効にして残す（欄が消えると、翻数を選んだ
 * 直後に触る点数と回答ボタンが指の下でせり上がるため。web と同じ）。
 * 入力が揃うまで回答ボタンは押せない。
 *
 * @remarks
 * 問題が変わったときの入力リセットは、呼び出し元が `key` を変えて
 * 再マウントさせることで行う。
 */
export function ScorePracticeAnswerForm({
  onSubmit,
  disabled = false,
  isTsumo,
  isOya,
  requireYaku = false,
  simplifyMangan = false,
  requireFuForMangan = false,
  submitLabel,
  reserveYakuRow = false,
  noYaku,
  prefill,
}: ScorePracticeAnswerFormProps) {
  const t = useTranslations("score");
  const initialFields = fieldsOf(prefill);
  const [han, setHan] = useState(initialFields.han);
  const [fu, setFu] = useState(initialFields.fu);
  const [yakus, setYakus] = useState(initialFields.yakus);
  const [score, setScore] = useState(initialFields.score);
  const [scoreFromKo, setScoreFromKo] = useState(initialFields.scoreFromKo);
  const [scoreFromOya, setScoreFromOya] = useState(initialFields.scoreFromOya);
  // ユーザーが欄を触ったか。触った後は prefill の変化を無視する
  const [touched, setTouched] = useState(false);

  // prefill が変わったら、触っていない欄をその中身に合わせる（render 中に
  // state を合わせる。effect だと 1 度古い中身で描いてから直すことになる）
  const [appliedPrefill, setAppliedPrefill] = useState(prefill);
  if (prefill !== appliedPrefill) {
    setAppliedPrefill(prefill);
    if (!touched) {
      const fields = fieldsOf(prefill);
      setHan(fields.han);
      setFu(fields.fu);
      setYakus(fields.yakus);
      setScore(fields.score);
      setScoreFromKo(fields.scoreFromKo);
      setScoreFromOya(fields.scoreFromOya);
    }
  }

  const touch =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setTouched(true);
      setter(value);
    };

  const isMangan = han !== undefined && han >= MANGAN_MIN_HAN;
  const isFuRequired = !isMangan || requireFuForMangan;
  const paymentKind = paymentKindOf(isOya, isTsumo);

  // ダブル役満を採用したルールでは、翻数・点数の選択肢にダブル役満を足す
  const allowDoubleYakuman = allowsDoubleYakuman(useYakumanRules());

  const hanOptions = useMemo((): readonly SelectOption<number>[] => {
    // 満貫以上の区分は翻数しきい値の昇順で並べる（practiceHanTiers は降順）
    const manganPlusOptions = [...practiceHanTiers(allowDoubleYakuman)]
      .reverse()
      .map((tier) => ({
        value: tier.minHan,
        label: t(`form.options.${tier.key}`),
      }));
    const numbered = (count: number) =>
      Array.from({ length: count }, (_, i) => ({
        value: i + 1,
        label: `${i + 1}${t("form.options.hanSuffix")}`,
      }));

    if (simplifyMangan) {
      return [...numbered(MANGAN_MIN_HAN - 1), ...manganPlusOptions];
    }
    // 簡略化しないモードでは役満未満は数値で出し、役満以上だけ区分名で出す
    return [
      ...numbered(YAKUMAN_HAN - 1),
      ...manganPlusOptions.filter((option) => option.value >= YAKUMAN_HAN),
    ];
  }, [simplifyMangan, allowDoubleYakuman, t]);

  const fuOptions = useMemo(
    (): readonly SelectOption<number>[] =>
      FU_VALUES.map((v) => ({
        value: v,
        label: `${v}${t("form.options.fuSuffix")}`,
      })),
    [t],
  );

  const kiriageMangan = useRuleSettingsStore((s) => s.kiriageMangan);
  const availableScores = useMemo(
    () =>
      getAvailableScores(
        han,
        isOya,
        isTsumo,
        undefined,
        kiriageMangan,
        allowDoubleYakuman,
      ),
    [han, isOya, isTsumo, kiriageMangan, allowDoubleYakuman],
  );

  const isComplete =
    han !== undefined &&
    (!isFuRequired || fu !== undefined) &&
    (availableScores.type === "koTsumo"
      ? scoreFromKo !== undefined && scoreFromOya !== undefined
      : score !== undefined);

  const handleSubmit = () => {
    if (han === undefined) return;
    if (isFuRequired && fu === undefined) return;

    const submitYakus = requireYaku ? [...yakus] : [];
    const submitFu = isFuRequired ? fu : isMangan ? undefined : fu;

    if (availableScores.type === "koTsumo") {
      if (scoreFromKo === undefined || scoreFromOya === undefined) return;
      onSubmit({
        han,
        fu: submitFu,
        scoreFromKo,
        scoreFromOya,
        yakus: submitYakus,
      });
    } else {
      if (score === undefined) return;
      onSubmit({ han, fu: submitFu, score, yakus: submitYakus });
    }
  };

  // 「役なし」はロンにしか無い回答なので、渡されたときだけ「役」の行の右端に置く
  const noYakuButton = noYaku && (
    <Pressable
      onPress={noYaku.onSelect}
      disabled={disabled}
      accessibilityRole="button"
      hitSlop={8}
    >
      {({ pressed }) => (
        <Text style={[styles.noYaku, pressed && styles.noYakuPressed]}>
          {noYaku.label}
        </Text>
      )}
    </Pressable>
  );

  return (
    <View style={styles.form}>
      {requireYaku ? (
        <YakuSelect
          value={yakus}
          onChange={touch(setYakus)}
          disabled={disabled}
          labelAction={noYakuButton}
        />
      ) : reserveYakuRow ? (
        <YakuLabelRow action={noYakuButton} />
      ) : undefined}

      <View>
        <Text style={styles.label}>{t("form.labels.han")}</Text>
        <SelectField
          options={hanOptions}
          value={han}
          onChange={touch(setHan)}
          placeholder={t("form.placeholders.select")}
          accessibilityLabel={t("form.labels.han")}
          disabled={disabled}
        />
      </View>

      {/* 満貫以上で符が不要になっても欄は残し、注記を欄の中に出す */}
      <View>
        <Text style={styles.label}>{t("form.labels.fu")}</Text>
        <SelectField
          options={isFuRequired ? fuOptions : []}
          value={isFuRequired ? fu : undefined}
          onChange={touch(setFu)}
          placeholder={
            isFuRequired
              ? t("form.placeholders.select")
              : t("form.messages.fuNotRequired")
          }
          accessibilityLabel={t("form.labels.fu")}
          disabled={disabled || !isFuRequired}
        />
      </View>

      <View>
        <Text style={styles.label}>{t("form.labels.score")}</Text>
        {availableScores.type === "koTsumo" ? (
          <View style={styles.koTsumoRow}>
            <View style={styles.koTsumoColumn}>
              <ScoreOptionSelect
                value={scoreFromKo}
                onChange={touch(setScoreFromKo)}
                options={availableScores.koScores}
                placeholder={t("form.placeholders.fromKo")}
                accessibilityLabel={t("form.placeholders.fromKo")}
                disabled={disabled}
              />
            </View>
            <Text style={styles.slash}>/</Text>
            <View style={styles.koTsumoColumn}>
              <ScoreOptionSelect
                value={scoreFromOya}
                onChange={touch(setScoreFromOya)}
                options={availableScores.oyaScores}
                placeholder={t("form.placeholders.fromOya")}
                accessibilityLabel={t("form.placeholders.fromOya")}
                disabled={disabled}
              />
            </View>
          </View>
        ) : (
          <ScoreOptionSelect
            value={score}
            onChange={touch(setScore)}
            options={availableScores.scores}
            placeholder={t("form.placeholders.select")}
            accessibilityLabel={t("form.labels.score")}
            disabled={disabled}
            optionSuffix={
              paymentKind === "oyaTsumo" ? t("form.options.all") : ""
            }
          />
        )}
      </View>

      <Button
        onPress={handleSubmit}
        size="lg"
        fullWidth
        disabled={disabled || !isComplete}
      >
        {submitLabel ?? t("form.buttons.answer")}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 20,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface700,
  },
  koTsumoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  koTsumoColumn: {
    flex: 1,
  },
  slash: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.surface500,
  },
  noYaku: {
    fontSize: 12,
    color: colors.mutedForeground,
    textDecorationLine: "underline",
    textDecorationColor: colors.surface300,
  },
  noYakuPressed: {
    color: colors.foreground,
  },
});
