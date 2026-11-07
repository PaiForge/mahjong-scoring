import { MentsuType, getKazeName } from "@mahjong-scoring/core";

import { DEFAULT_LOCALE, type SupportedLocale } from "../i18n/locales";
import type { LessonChoice, LessonPrompt } from "./quiz";

/**
 * 確認問題の辞書（`lessons`）を引く翻訳関数（`useTranslations` の戻り値のうち、
 * ここで使う形）
 */
type LessonTranslator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

/**
 * アプリの言語から、数の桁区切りに使う BCP 47 の言語タグへの対応
 *
 * 日本語・英語とも 3 桁ごとのカンマで、今は同じ文字列になる。言語ごとに書式が
 * 分かれたときに描く側を書き換えずに済むよう、言語を受ける形にしておく。
 */
const NUMBER_FORMAT_LOCALES: Readonly<Record<SupportedLocale, string>> = {
  ja: "ja-JP",
  en: "en-US",
};

/**
 * 点数をその言語の桁区切りで表示する
 * 点数表示
 *
 * @param points 点数
 * @param locale 表示する言語（省略時は既定の日本語。日本語固定の読み手は省略する）
 */
export function formatLessonPoints(
  points: number,
  locale: SupportedLocale = DEFAULT_LOCALE,
): string {
  return points.toLocaleString(NUMBER_FORMAT_LOCALES[locale]);
}

/**
 * 選択肢のボタンに出す文字列
 * 選択肢ラベル
 *
 * 数字だけで読めるもの（点数・子のツモの支払い）は辞書を通さずに組む。
 * 単位や語が付くもの（オール・翻・役満・符）は辞書から引く。
 *
 * @param choice 選択肢
 * @param t `lessons` 名前空間の翻訳関数
 */
export function lessonChoiceLabel(
  choice: LessonChoice,
  t: LessonTranslator,
): string {
  switch (choice.kind) {
    case "points":
      return formatLessonPoints(choice.points);
    case "koTsumo":
      return `${formatLessonPoints(choice.fromKo)} / ${formatLessonPoints(choice.fromOya)}`;
    case "oyaTsumo":
      return t("choiceLabels.oyaTsumo", {
        all: formatLessonPoints(choice.all),
      });
    case "han":
      return t("choiceLabels.han", { han: choice.han });
    case "yakuman":
      return t("choiceLabels.yakuman");
    case "fu":
      return t("choiceLabels.fu", { fu: choice.fu });
  }
}

/**
 * 不正解のときに「正解は〜」へ差し込む文字列
 * 正解ラベル
 *
 * ボタンでは単位を省いている点数・子のツモにだけ「点」を付ける。
 *
 * @param choice 正解の選択肢
 * @param t `lessons` 名前空間の翻訳関数
 */
export function lessonAnswerLabel(
  choice: LessonChoice,
  t: LessonTranslator,
): string {
  switch (choice.kind) {
    case "points":
    case "koTsumo":
      return t("answerLabels.points", { points: lessonChoiceLabel(choice, t) });
    case "oyaTsumo":
    case "han":
    case "yakuman":
    case "fu":
      return lessonChoiceLabel(choice, t);
  }
}

/** 面子の形を条件文の `select` に渡す名前 */
const MENTSU_SHAPES = {
  [MentsuType.Shuntsu]: "shuntsu",
  [MentsuType.Koutsu]: "koutsu",
  [MentsuType.Kantsu]: "kantsu",
} as const;

/**
 * 条件文（辞書の `lessons.<messageKey>.condition`）へ差し込む値
 * 条件文の値
 *
 * @param prompt 問題の条件
 * @param tScoreTable `scoreTable` 名前空間の翻訳関数（帯の名前を引く）
 */
export function lessonConditionValues(
  prompt: LessonPrompt,
  tScoreTable: (key: string) => string,
): Record<string, string | number> {
  switch (prompt.kind) {
    case "tier":
      return { han: prompt.han, tier: tScoreTable(prompt.tierKey) };
    case "yaku":
      return { yaku: prompt.yaku, state: prompt.naki ? "naki" : "menzen" };
    case "jantou":
      return {
        bakaze: getKazeName(prompt.bakaze),
        jikaze: getKazeName(prompt.jikaze),
      };
    case "mentsu":
      return { shape: MENTSU_SHAPES[prompt.mentsu.type] };
    case "machi":
      return {};
    case "tehai":
      return {
        bakaze: getKazeName(prompt.context.bakaze),
        jikaze: getKazeName(prompt.context.jikaze),
        winType: prompt.context.isTsumo ? "tsumo" : "ron",
      };
    case "agari":
      return {
        role: prompt.role,
        winType: prompt.winType,
        yaku: prompt.yaku.join("＋"),
        han: prompt.han,
      };
    case "extraFu":
      return {
        handShape: prompt.handShape,
        winType: prompt.winType,
        extraFu: prompt.extraFu,
      };
  }
}
