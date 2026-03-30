import type { Tehai14, HaiKindId, Kazehai } from "@pai-forge/riichi-mahjong";

/**
 * 役選択ドリルの問題
 * 完成手牌と和了状況を提示し、成立する役をすべて選択させる
 * 役選択問題
 */
export interface YakuQuestion {
  readonly id: string;
  readonly tehai: Tehai14;
  readonly context: {
    readonly bakaze: Kazehai;
    readonly jikaze: Kazehai;
    readonly agariHai: HaiKindId;
    readonly isTsumo: boolean;
    readonly isRiichi: boolean;
    readonly doraMarkers: readonly HaiKindId[];
  };
  /** 正解となる役名（日本語表示名）のリスト */
  readonly correctYakuNames: readonly string[];
}
