import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { MOBILE_AD_SLOTS } from "@mahjong-scoring/features/ads/native-ad";
import { adIndexAfterGroup } from "@mahjong-scoring/features/ads/spacing";
import {
  LEADERBOARD_PERIODS,
  leaderboardBoardGroups,
  type LeaderboardPeriod,
} from "@mahjong-scoring/features/leaderboard/boards";
import { boardLabel } from "@mahjong-scoring/features/my-record/board-label";
import { practiceBoardKey } from "@mahjong-scoring/features/practice-menu-types";
import { leaderboardHref } from "@mahjong-scoring/features/routes";

import { NativeAdRow } from "../../ads/native-ad-row";
import { useNativeAds } from "../../ads/use-native-ads";
import { useViewer } from "../../auth/use-viewer";
import { Chip } from "../../components/chip";
import { LinkRow, LinkRowList } from "../../components/link-row";
import { Screen } from "../../components/screen";
import { SectionTitle } from "../../components/section-title";
import { ToggleGroup } from "../../components/toggle-group";
import { fetchLeaderboardRanks } from "../../leaderboard/leaderboard-api";
import { useFocusRead } from "../../lib/use-focus-read";
import { colors } from "../../lib/theme";

/**
 * ランキング一覧
 *
 * @description
 * web の `/leaderboard`。全土俵（練習 × 出題設定）を分野ごとの行リンクで並べ、
 * 期間（総合 / 月間）を上の切り替えで選ぶ。ログイン中は各行に自分の順位を
 * 添える（挑戦していない土俵は「未挑戦」）。分野の末尾に間隔を広げながら
 * 広告の行を混ぜる（web と同じ）。
 *
 * web と違うもの: 期間は URL ではなく画面の中の状態で持つ（タブのように
 * 切り替えるだけで、戻る操作の履歴に積まない）。表の列の見出し（「種目・
 * 出題設定」「あなたの順位」）は置かない — 行の右の印で読める。
 *
 * @flow 練習の説明・結果の「ランキングをもっと見る」→ 詳細 → 「ランキング」で一覧
 */
export default function LeaderboardIndexScreen() {
  const t = useTranslations("leaderboard");
  const tPractice = useTranslations("practice");
  const tRoot = useTranslations();
  const router = useRouter();
  const [period, setPeriod] = useState<LeaderboardPeriod>("all-time");
  const ads = useNativeAds(MOBILE_AD_SLOTS.leaderboardIndex);
  const ranks = useViewerRanks(period);

  return (
    <Screen title={t("title")} back contentStyle={styles.content}>
      <View style={styles.intro}>
        <Text style={styles.description}>{t("indexDescription")}</Text>
        <ToggleGroup
          groups={[
            LEADERBOARD_PERIODS.map((value) => ({
              value,
              label: t(`period.${value}`),
            })),
          ]}
          selected={period}
          onSelect={setPeriod}
          accessibilityLabel={t("periodLabel")}
          fill
        />
      </View>

      {leaderboardBoardGroups().map((group, groupIndex) => {
        const adIndex = adIndexAfterGroup(groupIndex);
        const ad = adIndex === undefined ? undefined : ads[adIndex];
        return (
          <View key={group.category} style={styles.section}>
            <SectionTitle>
              {tPractice(`categories.${group.category}.title`)}
            </SectionTitle>
            <LinkRowList>
              {group.boards.map((board) => {
                const key = practiceBoardKey(board);
                return (
                  <LinkRow
                    key={key}
                    testID={`leaderboard-board-${key}`}
                    title={boardLabel(board, tRoot)}
                    trailing={
                      ranks === undefined ? undefined : (
                        <RankMark rank={ranks.get(key)} />
                      )
                    }
                    onPress={() => router.push(leaderboardHref(period, board))}
                  />
                );
              })}
              {ad !== undefined && <NativeAdRow creative={ad} />}
            </LinkRowList>
          </View>
        );
      })}
    </Screen>
  );
}

/**
 * ログイン中の本人の土俵ごとの順位（土俵のキー → 順位）
 *
 * ゲスト・読み込み中・読めなかった・ランキングに表示しない設定のあいだは
 * undefined（行に印を出さない）。読めなかったことは一覧の本体ではないので
 * 知らせない（web も順位の取得の失敗では行を「未挑戦」にしない）。
 */
function useViewerRanks(
  period: LeaderboardPeriod,
): ReadonlyMap<string, number> | undefined {
  const viewer = useViewer();
  const viewerId = viewer.kind === "ready" ? viewer.viewerId : undefined;
  const { state } = useFocusRead(
    useCallback(async () => {
      if (viewerId === undefined) return { period, ranks: undefined };
      const result = await fetchLeaderboardRanks(viewerId, period);
      if ("error" in result) return result;
      // 期間を添えておき、選び直した直後に前の期間の順位を出さない
      return {
        period,
        ranks: result.viewerHidden ? undefined : result.ranks,
      };
    }, [viewerId, period]),
  );
  if (state.kind !== "loaded" || state.value.period !== period) {
    return undefined;
  }
  const { ranks } = state.value;
  return ranks === undefined
    ? undefined
    : new Map(ranks.map((rank) => [practiceBoardKey(rank), rank.rank]));
}

/** 行の右に添える本人の順位（無ければ「未挑戦」） */
function RankMark({ rank }: { readonly rank: number | undefined }) {
  const t = useTranslations("leaderboard");
  if (rank === undefined) {
    return <Text style={styles.notRanked}>{t("notRanked")}</Text>;
  }
  return <Chip tone="primary">{t("rankLabel", { rank })}</Chip>;
}

const styles = StyleSheet.create({
  content: {
    gap: 32,
  },
  intro: {
    gap: 16,
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.surface500,
  },
  section: {
    gap: 16,
  },
  notRanked: {
    fontSize: 13,
    color: colors.surface500,
  },
});
