import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import {
  LEADERBOARD_PERIODS,
  isLeaderboardPeriod,
  resolveLeaderboardBoard,
  type LeaderboardPeriod,
} from "@mahjong-scoring/features/leaderboard/boards";
import type {
  MobileLeaderboardResponse,
  MobileLeaderboardRow,
} from "@mahjong-scoring/features/leaderboard/mobile-api";
import { boardLabel } from "@mahjong-scoring/features/my-record/board-label";
import {
  menuTypeToSlug,
  type PracticeBoard,
} from "@mahjong-scoring/features/practice-menu-types";
import {
  LEADERBOARD_PATH,
  leaderboardHref,
  practicePlayHref,
} from "@mahjong-scoring/features/routes";

import { useViewer } from "../../../auth/use-viewer";
import { Button, buttonForeground } from "../../../components/button";
import { PlayIcon } from "../../../components/icons/icons";
import { Screen } from "../../../components/screen";
import { SectionTitle } from "../../../components/section-title";
import { TextLink } from "../../../components/text-link";
import { ToggleGroup } from "../../../components/toggle-group";
import {
  fetchLeaderboard,
  type LeaderboardApiFailure,
} from "../../../leaderboard/leaderboard-api";
import { LeaderboardTable } from "../../../leaderboard/leaderboard-table";
import { HighlightPanel } from "../../../lessons/components/highlight-panel";
import { LoadFailed, LoadingIndicator } from "../../../components/load-state";
import { useFocusRead } from "../../../lib/use-focus-read";
import { colors } from "../../../lib/theme";
import { PracticeNotFoundScreen } from "../../../practice/screens/not-found-screen";

/**
 * ランキング詳細
 *
 * @description
 * web の `/leaderboard/<期間>/<練習>`（バリアントは `?variant=`）。1 つの土俵・期間の
 * ランキングを表で出し、行を押すとその人の公開プロフィールへ進む。ログイン中は
 * 本人の行を塗り、本人がページにいなければ表の下に本人の順位を添える。
 * ブロックした人の行はサーバーが除く（順位は数え直さない）。
 *
 * web と違うもの: ページ送りの代わりに、末尾の「さらに読み込む」で次の
 * ページを下に足す（お知らせの一覧と同じ）。期間の切り替えは同じ画面を
 * 置き換える（戻る操作の履歴に積まない）。ランキングに表示しない設定の
 * 案内は、設定がアプリに無いので文言だけを出す（変えるのは web の設定）。
 * 一覧（`/leaderboard`）への入口はアプリに常設していないので、表の下に
 * 「ほかの種目のランキング」を置く。
 *
 * @flow 練習の説明・結果の「ランキングをもっと見る」→ 詳細 → 行 → 公開プロフィール
 */
export default function LeaderboardDetailScreen() {
  const t = useTranslations("leaderboard");
  const params = useLocalSearchParams<{
    period?: string;
    module?: string;
    variant?: string;
  }>();
  const period =
    typeof params.period === "string" && isLeaderboardPeriod(params.period)
      ? params.period
      : undefined;
  const board =
    typeof params.module === "string"
      ? resolveLeaderboardBoard(params.module, params.variant)
      : undefined;

  if (period === undefined || board === undefined) {
    return <PracticeNotFoundScreen />;
  }
  return (
    <Screen title={t("title")} back contentStyle={styles.content}>
      <LeaderboardDetail period={period} board={board} />
    </Screen>
  );
}

function LeaderboardDetail({
  period,
  board,
}: {
  readonly period: LeaderboardPeriod;
  readonly board: PracticeBoard;
}) {
  const t = useTranslations("leaderboard");
  const tRoot = useTranslations();
  const router = useRouter();
  return (
    <>
      <View style={styles.section}>
        <SectionTitle>{boardLabel(board, tRoot)}</SectionTitle>
        <ToggleGroup
          groups={[
            LEADERBOARD_PERIODS.map((value) => ({
              value,
              label: t(`period.${value}`),
            })),
          ]}
          selected={period}
          onSelect={(value) => router.replace(leaderboardHref(value, board))}
          accessibilityLabel={t("periodLabel")}
          testID="leaderboard-period"
          fill
        />
        <Ranking period={period} board={board} />
      </View>

      <View style={styles.actions}>
        <Button
          size="lg"
          fullWidth
          testID="leaderboard-try-challenge"
          icon={<PlayIcon size={16} color={buttonForeground("primary")} />}
          onPress={() =>
            router.push(
              practicePlayHref(menuTypeToSlug(board.menuType), board.variant),
            )
          }
        >
          {t("tryChallenge")}
        </Button>
        <TextLink
          testID="leaderboard-other-boards"
          // 一覧から来たならそこまで閉じて戻る（push は一覧と詳細を交互に積む）
          onPress={() => router.dismissTo(LEADERBOARD_PATH)}
        >
          {t("otherBoards")}
        </TextLink>
      </View>
    </>
  );
}

/** 2 ページ目以降の読み足し */
interface MorePages {
  readonly rows: readonly MobileLeaderboardRow[];
  readonly page: number;
  readonly loading: boolean;
  readonly error?: LeaderboardApiFailure;
}

/** 表と読み足し */
function Ranking({
  period,
  board,
}: {
  readonly period: LeaderboardPeriod;
  readonly board: PracticeBoard;
}) {
  const t = useTranslations("leaderboard");
  const viewer = useViewer();
  const viewerId = viewer.kind === "ready" ? viewer.viewerId : undefined;
  // 土俵は描画ごとに URL から作り直すので、中身の値で読み直しを決める
  const { menuType, variant } = board;
  const read = useCallback(
    () => fetchLeaderboard(viewerId, period, { menuType, variant }, 1),
    [viewerId, period, menuType, variant],
  );
  // ログインの状態を読み終えるまで送らない（ゲストとして読むと本人の順位が抜ける）
  const { state, reload } = useFocusRead(
    viewer.kind === "ready" ? read : undefined,
  );
  // 1 ページ目を読み直したら読み足しを捨てる（重ねると同じ行が二重に並ぶ）
  const [more, setMore] = useState<{
    readonly base: MobileLeaderboardResponse;
    readonly pages: MorePages;
  }>();
  const firstPage = state.kind === "loaded" ? state.value : undefined;
  const pages =
    more !== undefined && more.base === firstPage ? more.pages : undefined;

  if (state.kind === "loading") return <LoadingIndicator />;
  if (state.kind === "failed") {
    return (
      <LoadFailed
        message={t("loadFailed")}
        retry={{ label: t("retry"), onPress: reload }}
      />
    );
  }

  const first = state.value;
  const rows = [...first.rows, ...(pages?.rows ?? [])];
  const lastPage = pages?.page ?? first.page;
  const hasMore = lastPage < first.totalPages;
  // 読み足した行に本人がいれば、表の下の本人の行は重ねない
  const viewerRow = rows.some((row) => row.isViewer)
    ? undefined
    : first.viewerRow;

  const loadMore = () => {
    setMore({
      base: first,
      pages: { rows: pages?.rows ?? [], page: lastPage, loading: true },
    });
    void fetchLeaderboard(viewerId, period, board, lastPage + 1).then(
      (result) => {
        setMore((prev) => {
          if (prev === undefined || prev.base !== first) return prev;
          if ("error" in result) {
            return {
              base: first,
              pages: { ...prev.pages, loading: false, error: result.error },
            };
          }
          return {
            base: first,
            pages: {
              rows: [...prev.pages.rows, ...result.rows],
              page: result.page,
              loading: false,
            },
          };
        });
      },
    );
  };

  return (
    <View style={[styles.section, state.pending && styles.pending]}>
      {first.viewerHidden && (
        <HighlightPanel>
          <Text style={styles.hiddenNote}>{t("viewerHidden")}</Text>
        </HighlightPanel>
      )}
      {rows.length === 0 && viewerRow === undefined ? (
        <Text style={styles.empty}>{t("emptyState")}</Text>
      ) : (
        <LeaderboardTable
          testID="leaderboard-table"
          rows={rows}
          viewerRow={viewerRow}
        />
      )}
      {first.totalCount > 0 && (
        <Text style={styles.total}>
          {t("pagination.total", { count: first.totalCount })}
        </Text>
      )}
      {pages?.error !== undefined && <LoadFailed message={t("loadFailed")} />}
      {hasMore && (
        <Button
          variant="secondary"
          fullWidth
          testID="leaderboard-more"
          disabled={pages?.loading === true}
          onPress={loadMore}
        >
          {t("loadMore")}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 32,
  },
  section: {
    gap: 16,
  },
  pending: {
    opacity: 0.5,
  },
  actions: {
    gap: 16,
    alignItems: "center",
  },
  hiddenNote: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.surface700,
    textAlign: "center",
  },
  empty: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.surface500,
  },
  total: {
    fontSize: 13,
    color: colors.surface500,
    textAlign: "right",
  },
});
