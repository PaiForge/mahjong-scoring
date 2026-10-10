import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import type { MobileRecordsResponse } from "@mahjong-scoring/features/my-record/mobile-api";
import { boardLabel } from "@mahjong-scoring/features/my-record/board-label";
import {
  getComparisonLabelKey,
  getNavigablePreviousPeriod,
  getPreviousPeriodLabel,
} from "@mahjong-scoring/features/my-record/period";
import { resolveRequestedBoard } from "@mahjong-scoring/features/my-record/requested-board";
import {
  buildChartData,
  computeAbsoluteChange,
  computeStats,
} from "@mahjong-scoring/features/my-record/stats";
import {
  DATE_PERIOD_VALUES,
  type DatePeriod,
} from "@mahjong-scoring/features/my-record/types";
import {
  menuTypeToSlug,
  practiceBoardKey,
  type PracticeBoard,
} from "@mahjong-scoring/features/practice-menu-types";
import { PRACTICE_PATH, practiceHref } from "@mahjong-scoring/features/routes";

import { Button } from "../../../components/button";
import { Screen } from "../../../components/screen";
import { SectionTitle } from "../../../components/section-title";
import { SelectField } from "../../../components/select-field";
import { TextLink } from "../../../components/text-link";
import { colors } from "../../../lib/theme";
import { AttemptTable } from "../../../mypage/attempt-table";
import { fetchRecords } from "../../../mypage/mypage-api";
import {
  MypageGate,
  MypageLoadFailed,
  MypageLoading,
} from "../../../mypage/mypage-gate";
import { ScoreChart } from "../../../mypage/score-chart";
import { StatsCard } from "../../../mypage/stats-card";
import { useMypageRead } from "../../../mypage/use-mypage-read";

/** 直近の履歴に並べる件数（web と同じ） */
const TABLE_DISPLAY_LIMIT = 5;

/** 全履歴のパス */
const RESULTS_PATH = "/mypage/challenges/results";

/**
 * マイレコード
 *
 * @description
 * web のマイレコード（`/mypage/challenges`）。チャレンジの成績を土俵
 * （練習 × 出題設定）と期間ごとに見る: ベスト・平均スコアと前の期間との差、
 * スコアの推移、直近の履歴。`?menu=&variant=` で開くとその土俵を選んだ
 * 状態で開く（結果画面の「マイレコードで推移を見る」）。
 *
 * web と違うもの:
 * - 期間・土俵を選び直すたびにアプリ向け API を読む（web は初期表示を
 *   サーバーで描き、選び直しを Server Action で読む）。期間の境界はサーバーが
 *   要求を受けた時刻の JST で切る
 * - 推移のグラフは値のツールチップを持たない（値は直近の履歴の表で読む）
 *
 * @flow
 * 1. マイページの「マイレコード」、または結果画面から開く
 * 2. 期間・土俵を選び直す → 統計・推移・直近の履歴が切り替わる
 * 3. 「すべての結果を見る」で全履歴へ、「◯◯にチャレンジ」でその練習の説明へ
 */
export default function MyRecordScreen() {
  const t = useTranslations("mypage.challenges");
  const params = useLocalSearchParams();
  const requested = resolveRequestedBoard(params);
  return (
    <Screen title={t("pageTitle")} back contentStyle={styles.content}>
      <MypageGate>
        {(userId) => <Dashboard userId={userId} requested={requested} />}
      </MypageGate>
    </Screen>
  );
}

function Dashboard({
  userId,
  requested,
}: {
  readonly userId: string;
  readonly requested: PracticeBoard | undefined;
}) {
  const t = useTranslations("mypage.challenges");
  const [board, setBoard] = useState(requested);
  const [period, setPeriod] = useState<DatePeriod>("thisWeek");
  const { state, reload } = useMypageRead(
    useCallback(
      () => fetchRecords(userId, board, period),
      [userId, board, period],
    ),
  );

  // 表示する土俵をアプリが知らなかった（サーバーの方が新しい版）ときは
  // `board` が無く、土俵の選択欄が空のまま開く。選べばその土俵を読む
  if (state.kind === "loading") return <MypageLoading />;
  if (state.kind === "failed")
    return <MypageLoadFailed message={t("loadFailed")} onRetry={reload} />;
  if (state.value.boards.length === 0) return <NoRecords />;
  return (
    <Records
      records={state.value}
      pending={state.pending}
      period={period}
      onPeriodChange={setPeriod}
      onBoardChange={setBoard}
    />
  );
}

/**
 * 記録が 1 件も無いとき。このページは行き止まりになるので、記録を作れる
 * 唯一の場所である練習一覧へ送る（web と同じ）
 */
function NoRecords() {
  const t = useTranslations("mypage.challenges");
  const router = useRouter();
  return (
    <View style={styles.noRecords}>
      <Text style={styles.muted}>{t("noData")}</Text>
      <Button onPress={() => router.push(PRACTICE_PATH)}>
        {t("goToPractice")}
      </Button>
    </View>
  );
}

function Records({
  records,
  pending,
  period,
  onPeriodChange,
  onBoardChange,
}: {
  readonly records: MobileRecordsResponse;
  readonly pending: boolean;
  readonly period: DatePeriod;
  readonly onPeriodChange: (period: DatePeriod) => void;
  readonly onBoardChange: (board: PracticeBoard) => void;
}) {
  const t = useTranslations("mypage.challenges");
  const tRoot = useTranslations();
  const router = useRouter();
  const { boards, board, current, previous } = records;

  const stats = useMemo(() => {
    const currentStats = computeStats(current);
    const previousStats = computeStats(previous);
    return {
      current: currentStats,
      bestChange: computeAbsoluteChange(
        currentStats.bestScore,
        previousStats.bestScore,
      ),
      avgChange: computeAbsoluteChange(
        currentStats.avgCompletionScore,
        previousStats.avgCompletionScore,
      ),
    };
  }, [current, previous]);
  const chartData = useMemo(
    () => buildChartData(current, previous),
    [current, previous],
  );

  const comparisonLabel = t(getComparisonLabelKey(period));
  const navigablePrevious = getNavigablePreviousPeriod(period);
  const labelOf = (target: PracticeBoard) => boardLabel(target, tRoot);

  return (
    <>
      <View style={styles.section}>
        <SectionTitle>{t("records")}</SectionTitle>
        <SelectField
          testID="my-record-period"
          options={DATE_PERIOD_VALUES.map((value) => ({
            value,
            label: t(`periods.${value}`),
          }))}
          value={period}
          onChange={onPeriodChange}
          placeholder={t(`periods.${period}`)}
          accessibilityLabel={t("periodLabel")}
        />
        <SelectField
          testID="my-record-board"
          options={boards.map((candidate) => ({
            value: practiceBoardKey(candidate),
            label: labelOf(candidate),
          }))}
          value={board === undefined ? undefined : practiceBoardKey(board)}
          onChange={(key) => {
            const next = boards.find(
              (candidate) => practiceBoardKey(candidate) === key,
            );
            if (next !== undefined) onBoardChange(next);
          }}
          placeholder={t("boardLabel")}
          accessibilityLabel={t("boardLabel")}
        />
      </View>

      <View style={[styles.section, pending && styles.pending]}>
        <View style={styles.stats}>
          <StatsCard
            label={t("bestScore")}
            value={
              stats.current.bestScore === undefined
                ? "-"
                : String(stats.current.bestScore)
            }
            comparison={{ change: stats.bestChange, label: comparisonLabel }}
          />
          <StatsCard
            label={t("avgScore")}
            value={
              stats.current.avgCompletionScore === undefined
                ? "-"
                : stats.current.avgCompletionScore.toFixed(1)
            }
            info={t("avgScoreInfo")}
            comparison={{
              change: stats.avgChange,
              label: comparisonLabel,
              // 値自身が小数第 1 位のため、増減もそろえる
              fractionDigits: 1,
            }}
          />
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>{t("scoreTrend")}</Text>
          <ScoreChart
            data={chartData}
            emptyMessage={t("noData")}
            currentLabel={t(`periods.${period}`)}
            previousLabel={t(`periods.${getPreviousPeriodLabel(period)}`)}
            onPreviousLabelPress={
              navigablePrevious === undefined
                ? undefined
                : () => onPeriodChange(navigablePrevious)
            }
          />
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>{t("recentHistory")}</Text>
          <AttemptTable
            attempts={current.slice(0, TABLE_DISPLAY_LIMIT)}
            emptyMessage={t("noData")}
            headers={{
              date: t("tableDate"),
              correctAnswers: t("tableCorrectAnswers"),
              incorrectAnswers: t("tableIncorrectAnswers"),
            }}
          />
          {current.length > TABLE_DISPLAY_LIMIT && (
            <View style={styles.center}>
              <TextLink
                testID="my-record-view-all"
                onPress={() => router.push(RESULTS_PATH)}
              >
                {t("viewAllResults")}
              </TextLink>
            </View>
          )}
        </View>
      </View>

      {/* 見ている土俵をそのまま解き直す導線。行き先は練習の説明（web と同じ —
          記録を眺めていた人が押した瞬間にカウントダウンが始まるのは重い）。
          バリアントを運ぶので、説明はその設定を選んだ状態で開く */}
      {board !== undefined && (
        <View style={styles.actions}>
          <Button
            size="lg"
            fullWidth
            testID="my-record-try"
            onPress={() =>
              router.push(
                practiceHref(menuTypeToSlug(board.menuType), board.variant),
              )
            }
          >
            {t("tryChallenge", { title: labelOf(board) })}
          </Button>
          <TextLink onPress={() => router.push(PRACTICE_PATH)}>
            {t("goToPractice")}
          </TextLink>
        </View>
      )}
    </>
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
  stats: {
    flexDirection: "row",
    gap: 12,
  },
  block: {
    gap: 12,
  },
  blockTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.surface900,
  },
  center: {
    alignItems: "center",
  },
  noRecords: {
    alignItems: "center",
    gap: 24,
    paddingVertical: 48,
  },
  muted: {
    fontSize: 15,
    color: colors.surface500,
  },
  // ボタンとその下の補助リンクの間は web の `SUB_LINK_GAP`（16）
  actions: {
    alignItems: "center",
    gap: 16,
  },
});
