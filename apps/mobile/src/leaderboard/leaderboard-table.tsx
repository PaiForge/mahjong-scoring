import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import type { MobileLeaderboardRow } from "@mahjong-scoring/features/leaderboard/mobile-api";
import { getMedalEmoji } from "@mahjong-scoring/features/leaderboard/podium";
import { publicProfileHref } from "@mahjong-scoring/features/routes";

import { missColor } from "../mypage/attempt-table";
import { UserAvatar } from "../mypage/user-avatar";
import { panelFrame } from "../lib/panel-styles";
import { colors } from "../lib/theme";

/** 列の幅（順位・スコア・ミス）。名前の列が残りを取る */
const RANK_WIDTH = 48;
const SCORE_WIDTH = 56;
const MISS_WIDTH = 48;

/** 上位3位の行の左端の縁の色 */
const PODIUM_EDGE: Readonly<Record<number, string>> = {
  1: colors.podiumGold,
  2: colors.podiumSilver,
  3: colors.podiumBronze,
};

/**
 * ランキングの表（web の `LeaderboardTable`）
 * ランキングテーブル
 *
 * 順位・プレイヤー・スコア・ミスの 4 列。行を押すとその人の公開プロフィールへ
 * 進む（web はプレイヤーの名前だけがリンクだが、指で押す画面では行全体を押せる
 * 面にする）。上位3位は順位にメダルを出し、行の左端に金属色の縁を付ける。本人の
 * 行は淡い緑で塗る（表彰台より優先。web と同じ）。
 *
 * `viewerRow` を渡すと、表の下に区切って本人の順位の行を足す（本人がこのページに
 * いないとき）。
 */
export function LeaderboardTable({
  rows,
  viewerRow,
  testID,
}: {
  readonly rows: readonly MobileLeaderboardRow[];
  readonly viewerRow?: MobileLeaderboardRow;
  readonly testID?: string;
}) {
  const t = useTranslations("leaderboard");
  return (
    <View style={styles.frame} testID={testID}>
      <View style={[styles.row, styles.header]}>
        <Text style={[styles.headerText, styles.rank]}>{t("table.rank")}</Text>
        <Text style={[styles.headerText, styles.player]}>
          {t("table.player")}
        </Text>
        <Text style={[styles.headerText, styles.score, styles.number]}>
          {t("table.score")}
        </Text>
        <Text style={[styles.headerText, styles.miss, styles.number]}>
          {t("table.miss")}
        </Text>
      </View>
      {rows.map((row, i) => (
        <RankingRow key={row.username} row={row} divided={i > 0} />
      ))}
      {viewerRow !== undefined && (
        <View style={styles.viewerSection}>
          <RankingRow row={viewerRow} divided={false} isViewerRow />
        </View>
      )}
    </View>
  );
}

/** 表の 1 行 */
function RankingRow({
  row,
  divided,
  isViewerRow = false,
}: {
  readonly row: MobileLeaderboardRow;
  readonly divided: boolean;
  /** 表の下に足した本人の順位の行（順位の上に「あなた」を添える） */
  readonly isViewerRow?: boolean;
}) {
  const t = useTranslations("leaderboard");
  const router = useRouter();
  const name = row.displayName ?? row.username;
  const medal = getMedalEmoji(row.rank);
  const edge = PODIUM_EDGE[row.rank];
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${t("rankLabel", { rank: row.rank })} ${name}`}
      testID={`leaderboard-row-${row.username}`}
      onPress={() => router.push(publicProfileHref(row.username))}
      style={({ pressed }) => [
        styles.row,
        divided && styles.divider,
        row.isViewer && styles.viewer,
        edge !== undefined && { borderLeftWidth: 4, borderLeftColor: edge },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.rank}>
        {isViewerRow && <Text style={styles.you}>{t("yourRank")}</Text>}
        <Text style={medal === undefined ? styles.rankNumber : styles.medal}>
          {medal ?? row.rank}
        </Text>
      </View>
      <View style={[styles.player, styles.playerCell]}>
        <UserAvatar avatarUrl={row.avatarUrl} name={name} size={28} />
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
      </View>
      <Text style={[styles.cell, styles.score, styles.number, styles.strong]}>
        {row.score}
      </Text>
      <Text
        style={[
          styles.cell,
          styles.miss,
          styles.number,
          { color: missColor(row.incorrectAnswers) },
        ]}
      >
        {row.incorrectAnswers}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: panelFrame,
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    paddingHorizontal: 8,
    gap: 4,
  },
  header: {
    minHeight: 36,
    // 見出しは灰（web の DataTable と同じ）。淡緑は自分の行（viewer）だけ
    backgroundColor: colors.surface50,
    borderBottomWidth: 1,
    borderBottomColor: colors.panel,
  },
  headerText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.surface600,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.surface100,
  },
  viewer: {
    backgroundColor: colors.brandSubtle,
  },
  viewerSection: {
    borderTopWidth: 1,
    borderTopColor: colors.panel,
  },
  pressed: {
    backgroundColor: colors.surface50,
  },
  rank: {
    width: RANK_WIDTH,
    alignItems: "center",
    textAlign: "center",
  },
  rankNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.surface700,
    fontVariant: ["tabular-nums"],
  },
  medal: {
    fontSize: 20,
  },
  you: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.brandSubtleForeground,
  },
  player: {
    flex: 1,
  },
  playerCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  name: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "500",
    color: colors.surface700,
  },
  cell: {
    fontSize: 15,
    color: colors.surface700,
  },
  strong: {
    fontWeight: "600",
  },
  score: {
    width: SCORE_WIDTH,
  },
  miss: {
    width: MISS_WIDTH,
  },
  number: {
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
});
