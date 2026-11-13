import type { Translate } from "../i18n/translate";
import { type Kazehai, MentsuType, getKazeName } from "@mahjong-scoring/core";

import { DEFAULT_LOCALE, type SupportedLocale } from "../i18n/locales";
import type { LessonChoice, LessonPrompt } from "./quiz";

/**
 * 確認問題の辞書（`lessons`）を引く翻訳関数（`useTranslations` の戻り値のうち、
 * ここで使う形）
 */
type LessonTranslator = Translate;

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
 * @param locale 数の桁区切りの言語（省略時は日本語。日本語固定のモバイルは省略する）
 */
export function lessonChoiceLabel(
  choice: LessonChoice,
  t: LessonTranslator,
  locale: SupportedLocale = DEFAULT_LOCALE,
): string {
  switch (choice.kind) {
    case "points":
      return formatLessonPoints(choice.points, locale);
    case "koTsumo":
      return `${formatLessonPoints(choice.fromKo, locale)} / ${formatLessonPoints(choice.fromOya, locale)}`;
    case "oyaTsumo":
      return t("choiceLabels.oyaTsumo", {
        all: formatLessonPoints(choice.all, locale),
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
 * @param locale 数の桁区切りの言語（省略時は日本語。日本語固定のモバイルは省略する）
 */
export function lessonAnswerLabel(
  choice: LessonChoice,
  t: LessonTranslator,
  locale: SupportedLocale = DEFAULT_LOCALE,
): string {
  switch (choice.kind) {
    case "points":
    case "koTsumo":
      return t("answerLabels.points", {
        points: lessonChoiceLabel(choice, t, locale),
      });
    case "oyaTsumo":
    case "han":
    case "yakuman":
    case "fu":
      return lessonChoiceLabel(choice, t, locale);
  }
}

/** 面子の形を条件文の `select` に渡す名前 */
const MENTSU_SHAPES = {
  [MentsuType.Shuntsu]: "shuntsu",
  [MentsuType.Koutsu]: "koutsu",
  [MentsuType.Kantsu]: "kantsu",
} as const;

/**
 * 条件文の値のうち、言語で変わる語の組み立て方
 * 条件文の言語別オプション
 *
 * いずれも省略時は日本語（モバイル・既存の呼び出しの出力を変えない）。
 * features は辞書を読まないので、言語ごとの語は描く側が辞書から引いて渡す。
 */
export interface LessonConditionOptions {
  /**
   * 風の名前（場風・自風）。省略時は日本語の `getKazeName`（東・南・西・北）。
   * web は `common.kazeNames.<kazeNameKey(kaze)>` を引いて渡す
   */
  readonly kazeName?: (kaze: Kazehai) => string;
  /**
   * 役の組み合わせをつなぐ文字列。省略時は「＋」。
   * web は `lessons.yakuJoiner`（英語は「 + 」）を渡す
   */
  readonly yakuJoiner?: string;
  /**
   * 役名（core の日本語の役名。例: 七対子・断么九）を表示名にする関数。
   * 省略時は core の名前そのまま（モバイル・日本語の出力を変えない）。
   *
   * web は `yakuLabel(name, t("yakuNames"))` を渡す。`yakuNames` の日本語の値は
   * core の役名と一致するので、日本語のページで渡しても出力は変わらない。
   * `agariScore.yaku`（練習の表示名）を渡さないのは、日本語の値が core と字の違う行
   * （「断幺九」と core の「断么九」等）があり、日本語の条件文が変わるため
   */
  readonly yakuName?: (name: string) => string;
}

/**
 * 条件文（辞書の `lessons.<messageKey>.condition`）へ差し込む値
 * 条件文の値
 *
 * 言語で変わる語（風の名前・役名・役のつなぎ）は `options` で受ける。
 * features は日本語固定のモバイルと共有するので引数を足す形で広げ、
 * 省略時は従来どおり日本語の値を返す。
 *
 * @param prompt 問題の条件
 * @param tScoreTable `scoreTable` 名前空間の翻訳関数（帯の名前を引く）
 * @param options 言語で変わる語の組み立て方（省略時は日本語）
 */
export function lessonConditionValues(
  prompt: LessonPrompt,
  tScoreTable: (key: string) => string,
  options?: LessonConditionOptions,
): Record<string, string | number> {
  const kazeName = options?.kazeName ?? getKazeName;
  const yakuName = options?.yakuName ?? ((name: string) => name);
  switch (prompt.kind) {
    case "tier":
      return { han: prompt.han, tier: tScoreTable(prompt.tierKey) };
    case "yaku":
      return {
        yaku: yakuName(prompt.yaku),
        state: prompt.naki ? "naki" : "menzen",
      };
    case "jantou":
      return {
        bakaze: kazeName(prompt.bakaze),
        jikaze: kazeName(prompt.jikaze),
      };
    case "mentsu":
      return { shape: MENTSU_SHAPES[prompt.mentsu.type] };
    case "machi":
      return {};
    case "tehai":
      return {
        bakaze: kazeName(prompt.context.bakaze),
        jikaze: kazeName(prompt.context.jikaze),
        winType: prompt.context.isTsumo ? "tsumo" : "ron",
      };
    case "agari":
      return {
        role: prompt.role,
        winType: prompt.winType,
        yaku: prompt.yaku
          .map((name) => yakuName(name))
          .join(options?.yakuJoiner ?? "＋"),
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
