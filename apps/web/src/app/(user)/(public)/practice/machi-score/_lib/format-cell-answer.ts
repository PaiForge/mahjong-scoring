import type {
  MachiCellAnswer,
  ScoreQuestion,
  UserAnswer,
} from "@mahjong-scoring/core";
import { scoreAnswerToUserAnswer } from "../../_lib/payment-adapter";
import { practiceHanTier } from "../../score/_lib/han-tiers";

/**
 * マスの回答を 1 行の文字列にするための翻訳と表示モード
 * マス回答整形オプション
 */
export interface FormatCellAnswerOptions {
  /** `score` 名前空間の翻訳関数（`form.options.*` / `result.pointSuffix` を引く） */
  readonly t: (key: string) => string;
  /** `machiScore.cells.noYakuShort` の文言 */
  readonly noYakuLabel: string;
  /** 満貫以上を区分名（満貫・跳満…）で出すか */
  readonly simplifyMangan: boolean;
  readonly allowDoubleYakuman: boolean;
}

/** 翻数の表示（区分名か「n翻」） */
function formatHan(
  han: number,
  { t, simplifyMangan, allowDoubleYakuman }: FormatCellAnswerOptions,
): string {
  const tier = simplifyMangan
    ? practiceHanTier(han, allowDoubleYakuman)
    : undefined;
  return tier
    ? t(`form.options.${tier.key}`)
    : `${han}${t("form.options.hanSuffix")}`;
}

/**
 * 支払いの表示（ロン「n点」・親ツモ「nオール」・子ツモ「a/b」）
 *
 * ツモは支払いの内訳や「オール」が単位を兼ねるため「点」を付けない
 * （`formatScoreAnswer` と同じ表記）。
 */
function formatPayment(
  answer: UserAnswer,
  isOyaTsumo: boolean,
  { t }: FormatCellAnswerOptions,
): string {
  if (answer.scoreFromKo !== undefined) {
    return `${answer.scoreFromKo}/${answer.scoreFromOya}`;
  }
  if (isOyaTsumo) return `${answer.score}${t("form.options.all")}`;
  return `${answer.score}${t("result.pointSuffix")}`;
}

/**
 * マスの回答を「3翻40符 5200点」のような 1 行にする
 * マス回答整形
 *
 * 回答済みのマスと結果の一覧に出す要約。親ツモは点数の後ろに「オール」を
 * 付けたいが、回答（`UserAnswer`）は親子を持たないため呼び出し側が
 * `isOyaTsumo` で指定する。
 */
export function formatCellAnswer(
  answer: MachiCellAnswer,
  options: FormatCellAnswerOptions & { readonly isOyaTsumo: boolean },
): string {
  if (answer.kind === "noYaku") return options.noYakuLabel;
  const { answer: user } = answer;
  const han = formatHan(user.han, options);
  const fu =
    user.fu !== undefined
      ? `${user.fu}${options.t("form.options.fuSuffix")}`
      : undefined;
  const payment = formatPayment(user, options.isOyaTsumo, options);
  return [han, fu, payment].filter(Boolean).join(" ");
}

/**
 * マスの正解を回答と同じ形にする
 * 正解のマス回答化
 *
 * 結果の一覧で正解も {@link formatCellAnswer} で描くための変換。役なしの
 * マス（`cell` が undefined）は「役なし」の回答になる。
 */
export function correctCellAnswerOf(
  cell: Readonly<ScoreQuestion> | undefined,
): MachiCellAnswer {
  if (!cell) return { kind: "noYaku" };
  return { kind: "score", answer: scoreAnswerToUserAnswer(cell.answer) };
}
