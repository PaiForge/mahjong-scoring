import type { MachiCellAnswer, ScoreQuestion } from "@mahjong-scoring/core";
import { scoreAnswerToUserAnswer } from "@mahjong-scoring/features/results/payment-adapter";
import {
  formatHan,
  formatPayment,
  type FormatHanOptions,
} from "../score/format-answer";

/**
 * マスの回答を 1 行の文字列にするための翻訳と表示モード
 * マス回答整形オプション
 */
export interface FormatCellAnswerOptions extends FormatHanOptions {
  /** `tenpaiScore.cells.noYakuShort` の文言 */
  readonly noYakuLabel: string;
}

/**
 * マスの回答を「翻・符」と「支払い」の行に分ける
 * マス回答の行分け
 *
 * 答え合わせのタブのように幅の狭い場所で、「3翻 40符」と「5200点」を
 * 2 行に積んで出すための形。1 行に並べると幅が点数の文字で決まって
 * タブが横に長くなり、待ちを並べて見比べる列が画面に収まらない。
 * 役なしは行が 1 つ（文言だけ）。親ツモは点数の後ろに「オール」を
 * 付けたいが、回答（`UserAnswer`）は親子を持たないため呼び出し側が
 * `isOyaTsumo` で指定する。
 */
export function formatCellAnswerLines(
  answer: MachiCellAnswer,
  options: FormatCellAnswerOptions & { readonly isOyaTsumo: boolean },
): readonly string[] {
  if (answer.kind === "noYaku") return [options.noYakuLabel];
  const { answer: user } = answer;
  const han = formatHan(user.han, options);
  const fu =
    user.fu !== undefined
      ? `${user.fu}${options.t("form.options.fuSuffix")}`
      : undefined;
  const payment = formatPayment(user, options.isOyaTsumo, options);
  return [[han, fu].filter(Boolean).join(" "), payment];
}

/**
 * マスの回答を「3翻 40符 5200点」のような 1 行にする
 * マス回答整形
 *
 * 回答済みのマスに出す要約。{@link formatCellAnswerLines} を空白で
 * つないだもの。
 */
export function formatCellAnswer(
  answer: MachiCellAnswer,
  options: FormatCellAnswerOptions & { readonly isOyaTsumo: boolean },
): string {
  return formatCellAnswerLines(answer, options).join(" ");
}

/**
 * 1 問の盤面で使うマスの回答の整形関数
 * マス回答整形関数の組
 */
export interface CellAnswerFormatters {
  /** {@link formatCellAnswer} をそのマスの列（ツモ / ロン）で呼ぶ */
  readonly formatAnswer: (answer: MachiCellAnswer, isTsumo: boolean) => string;
  /** {@link formatCellAnswerLines} をそのマスの列（ツモ / ロン）で呼ぶ */
  readonly formatAnswerLines: (
    answer: MachiCellAnswer,
    isTsumo: boolean,
  ) => readonly string[];
}

/**
 * 1 問の盤面で使う整形関数を組み立てる
 * マス回答整形関数の生成
 *
 * 「オール」を付けるかは親の問題のツモ列だけなので、問題の親子を受け取り、
 * マスごとに列から `isOyaTsumo` を決める。盤面（web・モバイル）と
 * ヘルプツアーが同じ組み立てを使う。
 */
export function cellAnswerFormatters(
  options: FormatCellAnswerOptions & { readonly isOya: boolean },
): CellAnswerFormatters {
  const { isOya, ...formatOptions } = options;
  const optionsFor = (isTsumo: boolean) => ({
    ...formatOptions,
    isOyaTsumo: isOya && isTsumo,
  });
  return {
    formatAnswer: (answer, isTsumo) =>
      formatCellAnswer(answer, optionsFor(isTsumo)),
    formatAnswerLines: (answer, isTsumo) =>
      formatCellAnswerLines(answer, optionsFor(isTsumo)),
  };
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
