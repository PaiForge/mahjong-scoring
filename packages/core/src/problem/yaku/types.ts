import type { Tehai14, HaiKindId } from "@pai-forge/riichi-mahjong";
import type { AgariContext } from "../shared/agari-context";

/**
 * 役選択練習の問題
 * 完成手牌と和了状況を提示し、成立する役をすべて選択させる
 * 役選択問題
 */
export interface YakuQuestion {
  readonly id: string;
  readonly tehai: Tehai14;
  /** リーチ・ドラは役の成否に直結するため、この練習では必須 */
  readonly context: AgariContext & {
    /**
     * リーチを宣言しているか（盤面にリーチ棒を出す）。
     *
     * 宣言していても役満の手では `correctYakuNames` に「立直」が入らない
     * （役満は通常役と複合しない）。
     */
    readonly isRiichi: boolean;
    readonly doraMarkers: readonly HaiKindId[];
    /**
     * 裏ドラ表示牌。実際の麻雀と同じくリーチしている手だけが持つ
     * （`isRiichi` が偽なら常に undefined）。
     *
     * 役の正解には効かない（裏ドラは役ではない）が、リーチの手で裏ドラだけ
     * めくられていない盤面は実戦にない見え方になるため出題データに含める。
     */
    readonly uraDoraMarkers?: readonly HaiKindId[];
  };
  /** 正解となる役名（日本語表示名）のリスト */
  readonly correctYakuNames: readonly string[];
}
