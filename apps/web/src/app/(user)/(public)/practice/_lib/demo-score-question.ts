import { HaiKind } from "@mahjong-scoring/core";
import type {
  HaiKindId,
  ScoreQuestion,
  YakuDetail,
} from "@mahjong-scoring/core";

/**
 * 遊び方デモで共有する手牌（234m 567m 345p 678s 55s）
 *
 * 子・門前ツモ・両面待ちで和了した形。平和 + 断么九 + 門前清自摸和が確定する
 * ため、点数計算ドリルと満貫以上ドリルの双方のデモに使える（満貫以上側は
 * ドラと立直を足して5翻にする）。
 */
const DEMO_CLOSED: readonly HaiKindId[] = [
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
];

interface DemoScoreQuestionOptions {
  /**
   * ドラ表示牌。`ManZu1` なら二萬がドラで手牌に乗り、`SouZu1` なら二索が
   * ドラで手牌に乗らない。デモで見せたい翻数に合わせて選ぶ。
   */
  readonly doraMarkers: readonly HaiKindId[];
  readonly isRiichi: boolean;
  /** 役一覧を提示する出題形式のときだけ渡す */
  readonly yakuDetails?: readonly YakuDetail[];
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
  return {
    tehai: { closed: [...DEMO_CLOSED], exposed: [] },
    agariHai: HaiKind.PinZu3,
    isTsumo: true,
    jikaze: HaiKind.Nan,
    bakaze: HaiKind.Ton,
    ...options,
  } as unknown as ScoreQuestion;
}
