import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import type { ChallengeAttempt } from "@mahjong-scoring/features/my-record/types";
import { boardLabel } from "@mahjong-scoring/features/my-record/board-label";

import { Button } from "../../../components/button";
import { Screen } from "../../../components/screen";
import { SectionTitle } from "../../../components/section-title";
import { AttemptTable } from "../../../mypage/attempt-table";
import {
  fetchRecordResults,
  type MypageApiFailure,
} from "../../../mypage/mypage-api";
import {
  MypageGate,
  MypageLoadFailed,
  MypageLoading,
} from "../../../mypage/mypage-gate";
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

/** 2 ページ目以降の読み足し */
interface MorePages {
  readonly items: readonly ChallengeAttempt[];
  readonly page: number;
  readonly loading: boolean;
  readonly error?: MypageApiFailure;
}

function Results({ userId }: { readonly userId: string }) {
  const t = useTranslations("mypage.challengeResults");
  const tRoot = useTranslations();
  const { state, reload } = useMypageRead(
    useCallback(() => fetchRecordResults(userId, 1), [userId]),
  );
  // 1 ページ目を読み直したら読み足しを捨てる（重ねると同じ行が二重に並ぶ）
  const [more, setMore] = useState<{
    readonly base: unknown;
    readonly pages: MorePages;
  }>();
  const firstPage = state.kind === "loaded" ? state.value : undefined;
  const pages =
    more !== undefined && more.base === firstPage ? more.pages : undefined;

  if (state.kind === "loading") return <MypageLoading />;
  if (state.kind === "failed")
    return <MypageLoadFailed message={t("loadFailed")} onRetry={reload} />;

  const items = [...state.value.items, ...(pages?.items ?? [])];
  const lastPage = pages?.page ?? state.value.page;
  const hasMore = lastPage < state.value.totalPages;

  const loadMore = () => {
    const base = state.value;
    const nextPage = lastPage + 1;
    setMore({
      base,
      pages: {
        items: pages?.items ?? [],
        page: lastPage,
        loading: true,
      },
    });
    void fetchRecordResults(userId, nextPage).then((result) => {
      setMore((prev) => {
        if (prev === undefined || prev.base !== base) return prev;
        if ("error" in result) {
          return {
            base,
            pages: { ...prev.pages, loading: false, error: result.error },
          };
        }
        return {
          base,
          pages: {
            items: [...prev.pages.items, ...result.items],
            page: result.page,
            loading: false,
          },
        };
      });
    });
  };

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
      {pages?.error !== undefined && (
        <MypageLoadFailed message={t("loadFailed")} />
      )}
      {hasMore && (
        <Button
          variant="secondary"
          fullWidth
          testID="my-record-results-more"
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
});
