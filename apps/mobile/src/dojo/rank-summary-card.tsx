import { StyleSheet, View } from "react-native";
import type { RankSlug } from "@mahjong-scoring/features/ranks/registry";

import { beltCardFrame } from "./belt-style";
import { RankHeading } from "./rank-heading";

/**
 * 進み具合を持たない級カード（web の `RankSummaryCard`）
 * 級の要約カード
 *
 * 道場の級の行程カード（{@link RankJourneyCard}）と同じ枠（細枠 + 上端だけ帯色）と
 * 見出し行を持ち、取得状態の pill と「学ぶ / 練習する / 試験」の進み具合だけを
 * 持たない。練習一覧に級を掲げるためのもので、web と同じ形にそろえる（web の
 * 練習一覧は本人の取得状況を読まない静的なページ）。見出し行から級の詳細へ送る。
 */
export function RankSummaryCard({ rankSlug }: { readonly rankSlug: RankSlug }) {
  return (
    <View style={[styles.card, beltCardFrame(rankSlug)]}>
      <RankHeading rankSlug={rankSlug} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
});
