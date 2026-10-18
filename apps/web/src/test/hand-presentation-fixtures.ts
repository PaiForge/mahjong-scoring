import { HaiKind, type HaiKindId } from "@mahjong-scoring/core";
import { PlanBenefit } from "@mahjong-scoring/features/billing/plans";
import type { TehaiContext } from "@mahjong-scoring/features/board/tehai-context";

/**
 * 手牌の見せ方（理牌しない・上下の向き）を盤面で確かめるテストの共通データ
 * 手牌の見せ方テストデータ
 *
 * プロバイダの結線のテストと、描いた牌の順序のテストが同じ手と同じ Pro の
 * 閲覧者を使う。このモジュールはテスト専用。
 */

/** 123m 456p 789s 東東東 中 + 和了牌の中（理牌済み） */
export const PRESENTATION_CLOSED: readonly HaiKindId[] = [
  HaiKind.ManZu1,
  HaiKind.ManZu2,
  HaiKind.ManZu3,
  HaiKind.PinZu4,
  HaiKind.PinZu5,
  HaiKind.PinZu6,
  HaiKind.SouZu7,
  HaiKind.SouZu8,
  HaiKind.SouZu9,
  HaiKind.Ton,
  HaiKind.Ton,
  HaiKind.Ton,
  HaiKind.Chun,
  HaiKind.Chun,
];

/** {@link PRESENTATION_CLOSED} を中のツモで和了った場 */
export const PRESENTATION_CONTEXT: TehaiContext = {
  bakaze: HaiKind.Ton,
  jikaze: HaiKind.Nan,
  doraMarkers: [],
  agariHai: HaiKind.Chun,
  isTsumo: true,
};

/** 練習の拡張機能（Pro）を持つ閲覧者のプロフィール（`fetchViewerProfile` の戻り値） */
export function proViewerProfile() {
  return {
    avatarUrl: null,
    name: "bob",
    benefits: [PlanBenefit.PracticeTools],
    unreadNotificationCount: 0,
  };
}
