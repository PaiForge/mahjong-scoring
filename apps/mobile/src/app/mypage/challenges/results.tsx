import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import { boardLabel } from "@mahjong-scoring/features/my-record/board-label";

import { Button } from "../../../components/button";
import { Screen } from "../../../components/screen";
import { SectionTitle } from "../../../components/section-title";
import { AttemptTable } from "../../../mypage/attempt-table";
import { useLoadMore } from "../../../lib/use-load-more";
import { fetchRecordResults } from "../../../mypage/mypage-api";
import { MypageGate, MypageLoadFailed } from "../../../mypage/mypage-gate";
import { LoadingIndicator } from "../../../components/load-state";
import { useMypageRead } from "../../../mypage/use-mypage-read";

/**
 * チャレンジ全履歴
 *
 * @description
 * web の全履歴（`/mypage/challenges/results`）。すべての土俵のチャレンジを
 * 新しい順に並べる。
 *
 * web と違うもの: ページ送りの代わりに、末尾の「さらに読み込む」で次の
 * ページを下に足す（スマホで番号を押してページを替える形は見慣れない）。
 * 画面に戻るたびに 1 ページ目から読み直す。
 *
 * @flow マイレコードの「すべての結果を見る」 → 全履歴 → さらに読み込む
 */
export default function ChallengeResultsScreen() {
  const t = useTranslations("mypage.challengeResults");
  return (
    <Screen title={t("pageTitle")} back contentStyle={styles.content}>
      <MypageGate>{(userId) => <Results userId={userId} />}</MypageGate>
    </Screen>
  );
}

function Results({ userId }: { readonly userId: string }) {
  const t = useTranslations("mypage.challengeResults");
  const tRoot = useTranslations();
  const { state, reload } = useMypageRead(
    useCallback(() => fetchRecordResults(userId, 1), [userId]),
  );
  const firstPage = state.kind === "loaded" ? state.value : undefined;
  const { items, hasMore, loading, error, loadMore } = useLoadMore(
    firstPage,
    (page: number) => fetchRecordResults(userId, page),
  );

  if (state.kind === "loading") return <LoadingIndicator />;
  if (state.kind === "failed")
    return <MypageLoadFailed message={t("loadFailed")} onRetry={reload} />;

  return (
    <View style={styles.section}>
      <SectionTitle>{t("sectionTitle")}</SectionTitle>
      <AttemptTable
        attempts={items}
        emptyMessage={t("empty")}
        headers={{
          date: t("tableDate"),
          menu: t("tableMenu"),
          correctAnswers: t("tableCorrectAnswers"),
          incorrectAnswers: t("tableIncorrectAnswers"),
        }}
        boardLabelOf={(attempt) => boardLabel(attempt, tRoot)}
      />
      {error !== undefined && <MypageLoadFailed message={t("loadFailed")} />}
      {hasMore && (
        <Button
          variant="secondary"
          fullWidth
          testID="my-record-results-more"
          disabled={loading}
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
});
