"use client";

import { useLocale, useTranslations } from "next-intl";

import { ErrorFallback } from "@/app/[locale]/(user)/_components/error-fallback";
import { localizedHref } from "@/i18n/public-path";
import { getTranslatedPublication } from "@/i18n/translated-publications";
import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";
import { PRACTICE_PATH } from "@mahjong-scoring/features/routes";

/**
 * 練習一覧への戻り先（その言語で練習一覧が未公開なら日本語の一覧）
 *
 * 404 へ案内しないため、未公開の言語の一覧へは向けない。公開状態はクライアントから
 * 読める軽い表（`translated-publications.ts`）から引く。
 */
function practiceListHref(locale: SupportedLocale): string {
  if (locale === DEFAULT_LOCALE) return PRACTICE_PATH;
  return getTranslatedPublication(PRACTICE_PATH, locale) === "unpublished"
    ? PRACTICE_PATH
    : localizedHref(PRACTICE_PATH, locale);
}

/**
 * 練習機能のエラー境界
 *
 * 練習一覧 / play / result / 説明ページのすべてをカバーする。
 * 練習中の問題生成や状態管理のエラーを (user) シェルを残したまま隔離し、
 * ユーザーが練習一覧へ戻れるようにする。
 *
 * 英語の練習でも出る境界なので、文言は辞書から引き `ErrorFallback` に全部渡す
 * （1 つでも省くと英語のページに日本語の既定値が混ざる）。文言は練習専用の
 * `practice.errorBoundary` に置く。共通の `errorPage`（「問題が発生しました」）や
 * `challenge.backToList`（「練習一覧に戻る」）で代用しない — 日本語の練習の
 * エラー画面は「練習を読み込めませんでした」「練習一覧へ戻る」で出してきた文言で、
 * 英語化で日本語の出力を変えないため、ja の値はその文字列のまま持つ。
 */
export default function PracticeError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  const t = useTranslations("practice.errorBoundary");
  const rawLocale = useLocale();
  const locale = isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  return (
    <ErrorFallback
      error={error}
      reset={reset}
      logTag="Practice"
      title={t("title")}
      description={t("description")}
      retryLabel={t("retry")}
      backHref={practiceListHref(locale)}
      backLabel={t("backToList")}
    />
  );
}
