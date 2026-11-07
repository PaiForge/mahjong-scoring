"use client";

import { useLocale, useTranslations } from "next-intl";

import { ErrorFallback } from "@/app/[locale]/(user)/_components/error-fallback";
import { publishedHomeHref } from "@/i18n/translated-publications";

/**
 * マイページのエラー境界
 *
 * 認証必須の Server Action / DB クエリ失敗をページ単位で隔離する。
 *
 * マイページは英語でも出すので、文言は `errorPage` 名前空間から見出し・説明・
 * 再試行・ホームへの戻りまで全部渡す（`ErrorFallback` の既定値は日本語で、
 * 1 つでも省くと英語のページに日本語が混ざる）。ホームへの戻り先はその言語の
 * トップ（未公開なら日本語のトップ）。`(user)/error.tsx` と同じ形。
 */
export default function MypageError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  const t = useTranslations("errorPage");
  const locale = useLocale();

  return (
    <ErrorFallback
      error={error}
      reset={reset}
      logTag="Mypage"
      title={t("title")}
      description={t("description")}
      backHref={publishedHomeHref(locale)}
      backLabel={t("goHome")}
      retryLabel={t("retry")}
    />
  );
}
