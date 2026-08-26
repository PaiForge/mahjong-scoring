import type { Fu, Tehai14 } from "@pai-forge/riichi-mahjong";
import type { AgariContext } from "../shared/agari-context";
import type { FuDetail } from "../../score/fu-calculator";

/**
 * 手牌全体の合計符を答える問題
 * 合計符問題
 *
 * 面子・雀頭符（{@link ../mentsu-jantou-fu/types}）が要素ごとの符を個別に問うのに対し、
 * こちらは副底・和了符・待ち符まで含めた手牌1枚あたり1つの答えを問う。
 */
export interface TotalFuQuestion {
  readonly id: string;
  readonly tehai: Tehai14;
  readonly context: AgariContext;
  /** 正解の符（10符単位に切り上げ済み。七対子は25符、平和ツモは20符） */
  readonly answer: Fu;
  /**
   * 符の内訳（切り上げ前の各構成要素）
   *
   * 回答後のフィードバックで「どこを取りこぼしたか」を示すために持つ。
   * 合計は {@link answer} と一致しない場合がある（例: 22符 → 30符）。
   */
  readonly fuDetails: readonly FuDetail[];
}
