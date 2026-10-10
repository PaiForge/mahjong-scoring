import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { isLeaderboardBoard } from "@mahjong-scoring/features/leaderboard/boards";
import type { PracticeBoard } from "@mahjong-scoring/features/practice-menu-types";
import { leaderboardHref } from "@mahjong-scoring/features/routes";

import { useViewer } from "../auth/use-viewer";
import { SectionTitle } from "../components/section-title";
import { TextLink } from "../components/text-link";
import { useFocusRead } from "../lib/use-focus-read";
import { fetchLeaderboard } from "./leaderboard-api";
import { LeaderboardTable } from "./leaderboard-table";

/** プレビューに出す人数（web と同じ） */
const PREVIEW_COUNT = 3;

/**
 * 土俵の総合ランキングの上位（web の `BoardLeaderboardPreview`）
 * ランキングプレビュー
 *
 * 練習の説明画面と結果画面の末尾に置き、ランキングの詳細への導線にする
 * （ランキングはタブに置かない。web と同じ）。読み終えるまで・読めなかった
 * とき・まだ誰も挑戦していない土俵・ランキングを持たない練習（昇級試験）では
 * 何も描かない — 画面の本体は上の練習で、末尾に置くので場所を取っておかなくても
 * 上の内容は動かない。
 *
 * 閲覧者がブロックした人は除かれる（サーバーが除く。順位は数え直さないので
 * 1・2・4 位になることがある）。
 */
export function LeaderboardPreview({
  board,
}: {
  readonly board: PracticeBoard;
}) {
  if (!isLeaderboardBoard(board)) return undefined;
  return <Preview board={board} />;
}

function Preview({ board }: { readonly board: PracticeBoard }) {
  const t = useTranslations("leaderboard");
  const router = useRouter();
  const viewer = useViewer();
  const viewerId = viewer.kind === "ready" ? viewer.viewerId : undefined;
  // 土俵は呼び出し側が描画ごとに作り直すので、中身の値で読み直しを決める
  // （オブジェクトを依存に入れると、フォーカスのたびではなく描画のたびに読む）
  const { menuType, variant } = board;
  const read = useCallback(
    () => fetchLeaderboard(viewerId, "all-time", { menuType, variant }, 1),
    [viewerId, menuType, variant],
  );
  const { state } = useFocusRead(viewer.kind === "ready" ? read : undefined);

  if (state.kind !== "loaded") return undefined;
  const rows = state.value.rows.slice(0, PREVIEW_COUNT);
  if (rows.length === 0) return undefined;
  return (
    <View style={styles.section} testID="leaderboard-preview">
      <SectionTitle>{t("allTimeRanking")}</SectionTitle>
      <LeaderboardTable rows={rows} />
      <View style={styles.more}>
        <TextLink
          testID="leaderboard-preview-more"
          onPress={() => router.push(leaderboardHref("all-time", board))}
        >
          {t("viewMore")}
        </TextLink>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 16,
  },
  more: {
    alignItems: "center",
  },
});
