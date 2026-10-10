import { useMemo, useState } from "react";
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
import type { MobileLeaderboardRanksResponse } from "@mahjong-scoring/features/leaderboard/mobile-api";
import { boardLabel } from "@mahjong-scoring/features/my-record/board-label";
import { practiceBoardKey } from "@mahjong-scoring/features/practice-menu-types";
import { PREFERENCES_PATH } from "@mahjong-scoring/features/routes";

import { NativeAdRow } from "../../ads/native-ad-row";
import { useNativeAds } from "../../ads/use-native-ads";
import { useViewer } from "../../auth/use-viewer";
import { Chip } from "../../components/chip";
import { Divider } from "../../components/divider";
import { LinkRowList } from "../../components/link-row";
import { Screen } from "../../components/screen";
import { SectionTitle } from "../../components/section-title";
import { TextLink } from "../../components/text-link";
import { ToggleGroup } from "../../components/toggle-group";
import {
  fetchLeaderboardRanks,
  type LeaderboardApiFailure,
} from "../../leaderboard/leaderboard-api";
import { panelFrame } from "../../lib/panel-styles";
import { useFocusRead, type FocusReadState } from "../../lib/use-focus-read";
import { colors } from "../../lib/theme";

/**
 * ランキングでの自分の順位
 *
 * @description
 * web の `/leaderboard` の一覧から、本人の順位だけを取り出した画面。全土俵
 * （練習 × 出題設定）を分野ごとに並べ、各行に本人の順位（挑戦していない土俵は
 * 「未挑戦」）を添える。期間（総合 / 月間）は上の切り替えで選ぶ。分野の末尾に
 * 間隔を広げながら広告の行を混ぜる（web と同じ）。
 *
 * web と違うもの:
 * - 他の人の行（ランキングの詳細・練習の画面の上位 3 人・公開プロフィール）を
 *   持たない。アプリの中で他の利用者が入力したもの（ユーザー名・アバター）を
 *   見せないため。行は詳細へのリンクにせず、順位を読むだけの行にする
 * - 期間は URL ではなく画面の中の状態で持つ（タブのように切り替えるだけで、
 *   戻る操作の履歴に積まない）
 * - ランキングに表示しない設定のあいだは順位が付かない（web と同じ）ので、
 *   行の代わりにその旨と設定への導線を出す
 *
 * 順位は web のランキングと同じ母集団で数える。ユーザー名と成績が web の
 * ランキングに載ることはユーザー名の設定画面で伝えている。
 *
 * @flow マイページの「ランキングでの順位」→ 期間を切り替える →（非表示中なら）設定へ
 */
export default function LeaderboardIndexScreen() {
  const t = useTranslations("leaderboard");
  const [period, setPeriod] = useState<LeaderboardPeriod>("all-time");
  const viewer = useViewer();
  const viewerId = viewer.kind === "ready" ? viewer.viewerId : undefined;

  return (
    <Screen title={t("app.title")} back contentStyle={styles.content}>
      <View style={styles.intro}>
        <Text style={styles.description}>{t("app.description")}</Text>
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
          testID="leaderboard-period"
          fill
        />
      </View>
      {viewer.kind === "ready" && viewerId === undefined ? (
        <Text style={styles.description}>{t("app.signedOut")}</Text>
      ) : (
        <ViewerRanks viewerId={viewerId} period={period} />
      )}
    </Screen>
  );
}

/** 読めた本人の順位と、それを読んだ期間 */
interface RanksRead {
  readonly period: LeaderboardPeriod;
  readonly value: MobileLeaderboardRanksResponse;
}

/** 本人の順位の一覧（ログイン中）。ログインの状態を読んでいる間は印を出さない */
function ViewerRanks({
  viewerId,
  period,
}: {
  readonly viewerId: string | undefined;
  readonly period: LeaderboardPeriod;
}) {
  const t = useTranslations("leaderboard");
  const tPractice = useTranslations("practice");
  const tRoot = useTranslations();
  const router = useRouter();
  const ads = useNativeAds(MOBILE_AD_SLOTS.leaderboardIndex);
  // ログインの状態を読んでいる間は送らない（`useFocusRead` が loading のまま待つ）
  const read = useMemo(
    () =>
      viewerId === undefined
        ? undefined
        : async (): Promise<
            RanksRead | { readonly error: LeaderboardApiFailure }
          > => {
            const result = await fetchLeaderboardRanks(viewerId, period);
            if ("error" in result) return result;
            // 期間を添えておき、選び直した直後に前の期間の順位を出さない
            return { period, value: result };
          },
    [viewerId, period],
  );
  const { state, reload } = useFocusRead(read);
  const ranks = ranksOf(state, period);

  if (state.kind === "failed") {
    return (
      <View style={styles.failed}>
        <Text style={styles.failedText}>{t("loadFailed")}</Text>
        <TextLink onPress={reload}>{t("retry")}</TextLink>
      </View>
    );
  }
  if (state.kind === "loaded" && state.value.value.viewerHidden) {
    return (
      <View style={[panelFrame, styles.notice]} testID="leaderboard-hidden">
        <Text style={styles.noticeText}>{t("viewerHidden")}</Text>
        <TextLink onPress={() => router.push(PREFERENCES_PATH)}>
          {t("viewerHiddenLink")}
        </TextLink>
      </View>
    );
  }

  return leaderboardBoardGroups().map((group, groupIndex) => {
    const adIndex = adIndexAfterGroup(groupIndex);
    const ad = adIndex === undefined ? undefined : ads[adIndex];
    return (
      <View key={group.category} style={styles.section}>
        <SectionTitle>
          {tPractice(`categories.${group.category}.title`)}
        </SectionTitle>
        <View style={[panelFrame, styles.rows]}>
          {group.boards.map((board, index) => {
            const key = practiceBoardKey(board);
            return (
              <View key={key}>
                {index > 0 && <Divider tone="row" />}
                <View style={styles.row} testID={`leaderboard-board-${key}`}>
                  <Text style={styles.rowTitle}>
                    {boardLabel(board, tRoot)}
                  </Text>
                  {ranks !== undefined && <RankMark rank={ranks.get(key)} />}
                </View>
              </View>
            );
          })}
        </View>
        {ad !== undefined && (
          <LinkRowList>
            <NativeAdRow creative={ad} />
          </LinkRowList>
        )}
      </View>
    );
  });
}

/**
 * 読めた順位を土俵のキー → 順位の表にする。読み込み中・選び直した直後
 * （前の期間の値）は undefined（行に印を出さない）
 */
function ranksOf(
  state: FocusReadState<RanksRead, LeaderboardApiFailure>,
  period: LeaderboardPeriod,
): ReadonlyMap<string, number> | undefined {
  if (state.kind !== "loaded" || state.value.period !== period) {
    return undefined;
  }
  return new Map(
    state.value.value.ranks.map((rank) => [practiceBoardKey(rank), rank.rank]),
  );
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
  rows: {
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    minHeight: 48,
    paddingVertical: 12,
  },
  rowTitle: {
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 21,
    color: colors.surface900,
  },
  notRanked: {
    fontSize: 13,
    color: colors.surface500,
  },
  notice: {
    padding: 16,
    gap: 4,
    alignItems: "flex-start",
  },
  noticeText: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.surface800,
  },
  failed: {
    alignItems: "flex-start",
    gap: 4,
  },
  failedText: {
    fontSize: 15,
    color: colors.destructiveStrong,
  },
});
