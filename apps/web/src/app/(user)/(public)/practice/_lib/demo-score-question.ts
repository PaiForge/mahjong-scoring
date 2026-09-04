import { HaiKind } from "@mahjong-scoring/core";
import type {
  HaiKindId,
  ScoreQuestion,
  YakuDetail,
} from "@mahjong-scoring/core";

/**
 * 遊び方デモの牌姿（純手牌と和了牌、和了方法）
 * デモ牌姿
 */
interface DemoHand {
  readonly closed: readonly HaiKindId[];
  readonly agariHai: HaiKindId;
  readonly isTsumo: boolean;
}

/**
 * 面子手のデモ牌姿（234m 567m 345p 678s 55s）
 *
 * 子・門前ツモ・両面待ちで和了した形。平和 + 断么九 + 門前清自摸和が確定する
 * ため、点数計算ドリルと満貫以上ドリルの双方のデモに使える（満貫以上側は
 * ドラと立直を足して5翻にする）。
 */
export const DEMO_MENTSU_HAND: DemoHand = {
  closed: [
    HaiKind.ManZu2,
    HaiKind.ManZu3,
    HaiKind.ManZu4,
    HaiKind.ManZu5,
    HaiKind.ManZu6,
    HaiKind.ManZu7,
    HaiKind.PinZu3,
    HaiKind.PinZu4,
    HaiKind.PinZu5,
    HaiKind.SouZu6,
    HaiKind.SouZu7,
    HaiKind.SouZu8,
    HaiKind.SouZu5,
    HaiKind.SouZu5,
  ],
  agariHai: HaiKind.PinZu3,
  isTsumo: true,
};

/**
 * 役牌の暗刻を持つ面子手のデモ牌姿（發發發 234m 567m 345p 55s）
 *
 * 子・門前ロン（三筒の両面待ち）で和了した形。符が副底20 + 三元牌の暗刻8 +
 * 門前ロン10 = 38符 → 切り上げて40符、役は役牌（發）の1翻だけで 1翻40符 =
 * 1300点になる。
 *
 * {@link DEMO_MENTSU_HAND} と違って符を自分で積み上げないと点数が出ない形を
 * 選んでいる。あちらは平和で符が20符・30符に固定されるため、符から点数までを
 * 通しで解く出題（30〜50符の昇級試験）のデモにはならない。ロンなのは、
 * ツモだと門前清自摸和が乗って翻数が上がり、符の話が霞むため。
 */
export const DEMO_YAKUHAI_KOUTSU_HAND: DemoHand = {
  closed: [
    HaiKind.Hatsu,
    HaiKind.Hatsu,
    HaiKind.Hatsu,
    HaiKind.ManZu2,
    HaiKind.ManZu3,
    HaiKind.ManZu4,
    HaiKind.ManZu5,
    HaiKind.ManZu6,
    HaiKind.ManZu7,
    HaiKind.PinZu3,
    HaiKind.PinZu4,
    HaiKind.PinZu5,
    HaiKind.SouZu5,
    HaiKind.SouZu5,
  ],
  agariHai: HaiKind.PinZu3,
  isTsumo: false,
};

/**
 * 七対子のデモ牌姿（22m 55m 33p 77p 44s 88s 中中）
 *
 * 子・ロンで和了した形。七対子だけが成立する（么九牌の対子があるため断么九は
 * 付かず、7つの対子はすべて別の牌）。ロンなのは、ツモだと門前清自摸和が
 * 乗って翻数が上がるため — 七対子の試験は満貫未満の出題に限っており、
 * デモの牌姿もその範囲に収める。
 */
export const DEMO_CHIITOITSU_HAND: DemoHand = {
  closed: [
    HaiKind.ManZu2,
    HaiKind.ManZu2,
    HaiKind.ManZu5,
    HaiKind.ManZu5,
    HaiKind.PinZu3,
    HaiKind.PinZu3,
    HaiKind.PinZu7,
    HaiKind.PinZu7,
    HaiKind.SouZu4,
    HaiKind.SouZu4,
    HaiKind.SouZu8,
    HaiKind.SouZu8,
    HaiKind.Chun,
    HaiKind.Chun,
  ],
  agariHai: HaiKind.Chun,
  isTsumo: false,
};

/**
 * 遊び方デモ用の出題を組み立てるための指定
 * デモ出題オプション
 */
export interface DemoScoreQuestionOptions {
  /**
   * ドラ表示牌。`ManZu1` なら二萬がドラで手牌に乗り、`SouZu1` なら二索が
   * ドラで手牌に乗らない。デモで見せたい翻数に合わせて選ぶ。
   */
  readonly doraMarkers: readonly HaiKindId[];
  /**
   * 裏ドラ表示牌。出題はリーチしている手には必ず裏ドラも出すため、
   * `isRiichi` が真のデモは必ず渡す（リーチしていない手では盤面に出ない）。
   * デモで見せたい翻数を変えたくないなら、手牌に乗らない牌を選ぶ。
   */
  readonly uraDoraMarkers?: readonly HaiKindId[];
  readonly isRiichi: boolean;
  /** 役一覧を提示する出題形式のときだけ渡す */
  readonly yakuDetails?: readonly YakuDetail[];
  /** 牌姿の差し替え（既定は面子手）。七対子のように別の形を見せる出題が渡す */
  readonly hand?: DemoHand;
}

/**
 * 遊び方デモ用の出題を組み立てる
 * デモ出題生成
 *
 * `ScoreQuestion` は Tehai14（ブランド型）を含むため、リポジトリのテスト同様
 * `as unknown as` で静的構築する（`QuestionDisplay` は描画にのみ使うため
 * 検証不要）。
 */
export function buildDemoScoreQuestion(
  options: DemoScoreQuestionOptions,
): ScoreQuestion {
  const { hand = DEMO_MENTSU_HAND, ...rest } = options;

  return {
    tehai: { closed: [...hand.closed], exposed: [] },
    agariHai: hand.agariHai,
    isTsumo: hand.isTsumo,
    jikaze: HaiKind.Nan,
    bakaze: HaiKind.Ton,
    ...rest,
  } as unknown as ScoreQuestion;
}
