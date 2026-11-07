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
 * （1 つでも省くと英語のページに日本語の既定値が混ざる）。見出し・説明・再試行は
 * `errorPage`（境界の共通の文言）、戻りリンクは `challenge.backToList`。
 */
export default function PracticeError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  const t = useTranslations("errorPage");
  const tChallenge = useTranslations("challenge");
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
      backLabel={tChallenge("backToList")}
    />
  );
}
