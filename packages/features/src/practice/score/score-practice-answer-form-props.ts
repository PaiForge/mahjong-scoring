import type { UserAnswer } from "@mahjong-scoring/core";

import type { ScorePracticeModeFlags } from "./generator-options";

/**
 * 点数計算の無限訓練の回答フォームの props（web とアプリで共有）
 * 無限訓練回答フォームprops
 *
 * 役（設定で求めるとき）・翻数・符・点数を選んで回答する。判定モード
 * （{@link ScorePracticeModeFlags}）は省略すると「役なし・翻数と符あり・
 * 区分で答える・満貫以上は符なし」。満貫以上で符が不要になっても符の欄は
 * 消さず無効にして残す（欄が消えると、翻数を選んだ直後に触る点数と回答
 * ボタンが指の下でせり上がるため）。入力が揃うまで回答ボタンは押せない。
 * 点数だけを問う設定で `autoSubmit` なら、点数を選んだ時点で送りボタンを出さない。
 *
 * @remarks
 * 問題が変わったときの入力リセットは、呼び出し元が `key` を変えて
 * 再マウントさせることで行う。
 */
export interface ScorePracticeAnswerFormProps extends Partial<ScorePracticeModeFlags> {
  readonly onSubmit: (answer: UserAnswer) => void;
  readonly disabled?: boolean;
  readonly isTsumo: boolean;
  readonly isOya: boolean;
  /** 回答ボタンの文言。既定は「回答する」 */
  readonly submitLabel?: string;
  /**
   * 点数だけを問う設定（役も翻数・符も答えない）のとき、点数を選んだ時点で
   * 送る（既定 false）。他の欄も答える設定では渡しても効かず、ボタンで送る。
   * 和了形の点数計算（とその体験）が立てる。聴牌形の点数計算はマスを確定する
   * 流れが別で、マスごとのフォームに「このマスに当てはめる」のボタンを残す。
   * 理由は features の `useScorePracticeAnswerForm` の `autoSubmit`
   */
  readonly autoSubmit?: boolean;
  /**
   * 「役」のラベル行を役の回答が不要でも出す。「役なし」の置き場をツモ・
   * ロンの別によらず確保し、フォームの高さを変えないため（聴牌形の点数計算が
   * 立てる。和了形の点数計算は役の回答が必要なときだけ行が出る）
   */
  readonly reserveYakuRow?: boolean;
  /**
   * 「役なし（ロンできない）」を回答として選べるようにする。指定すると「役」の
   * ラベル行の右端にリンク風のボタンを出し、押した時点で `onSelect` を呼ぶ。
   * 役なしは押した瞬間に回答として完結する（翻・符・点数に入れるものが
   * 無い）ので、回答ボタンを経由させない — チェックボックスにして回答
   * ボタンで確定させる形は、チェックだけで答えたつもりになるうえ、選択中の
   * マスを足すとフォームが作り直されてチェックが黙って外れた。ロンにしか
   * 無い回答なので、ツモのマスを答えるときは渡さない（`reserveYakuRow` と
   * 組めば行の高さは変わらず、ラベル行の右側が空くだけ）
   */
  readonly noYaku?: {
    readonly label: string;
    readonly onSelect: () => void;
  };
  /**
   * 入力欄に読み込んでおく回答。まだ何も入力していない間だけ効く
   *
   * 聴牌形の点数計算で「回答済みのマスを選択に加える」と、そのマスの回答が
   * ここに渡り、翻・符・点数（役）が入った状態になる — 同じ点数の待ちを
   * 後からまとめ直すときや、まとめて答えた符だけ直すときに、同じ内容を
   * 入れ直さずに済む。値が変わるたびに欄を合わせる（1 種類に定まらなく
   * なって undefined になれば空に戻す）が、ユーザーが 1 度でも欄を触った
   * あとは無視する — 入力の途中で回答済みのマスを誤タップした拍子に、
   * 入れかけの内容が置き換わってはいけない。触った記録は mount ごと
   * （親が key で作り直すたび）にリセットされる
   */
  readonly prefill?: UserAnswer;
}
