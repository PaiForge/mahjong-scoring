/**
 * 符の選択肢セルのラベル体裁
 * 符選択肢ラベル
 *
 * 盤面（{@link import("../_components/fu-choice-grid").FuChoiceGrid}）と
 * 遊び方デモ（{@link import("../_components/demo-fu-choice-grid").DemoFuChoiceGrid}）で
 * 共有する。デモは盤面と同じ体裁で描くため、片方だけ変えない。
 *
 * `whitespace-nowrap` と横詰めの padding は「100符」「110符」を 1 行に収めるため。
 * 3 列グリッドの 1 セルは狭い端末で 90px 前後まで縮み、素の `p-4`（左右 16px）と
 * `text-2xl` では 3 文字の符が折り返して 2 行になる（デモは囲み枠の分さらに狭い）。
 * 文字サイズを sm 未満で 1 段落とすのも同じ理由で、幅 360px までは折り返さない。
 */
export const FU_CHOICE_LABEL_CLASSES =
  "px-2 text-xl whitespace-nowrap sm:px-4 sm:text-2xl";
