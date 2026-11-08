"use client";

import { useLocale, useTranslations } from "next-intl";

import { ErrorFallback } from "@/app/[locale]/(user)/_components/error-fallback";
import { publishedHomeHref } from "@/i18n/translated-publications";

/**
 * マイページのエラー境界
 *
 * 認証必須の Server Action / DB クエリ失敗をページ単位で隔離する。
 *
 * マイページは英語でも出すので、見出しから再試行・ホームへの戻りまで全部辞書から
 * 渡す（`ErrorFallback` の既定値は日本語で、1 つでも省くと英語のページに日本語が
 * 混ざる）。ホームへの戻り先はその言語のトップ（未公開なら日本語のトップ）。
 *
 * 見出し・説明は汎用の `errorPage` ではなく `mypage.error` から引く。日本語は
 * 英語化の前に直書きしていた「マイページを読み込めませんでした」の文言のままで、
 * `errorPage` の「問題が発生しました」に寄せると日本語の表示が変わるため。
 * 再試行・ホームへの戻りは `errorPage` を引く（日本語の値が `ErrorFallback` の
 * 既定値と同じ文字列なので、日本語の表示は変わらない）。
 */
export default function MypageError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  const t = useTranslations("mypage");
  const tErrorPage = useTranslations("errorPage");
  const locale = useLocale();

  return (
    <ErrorFallback
      error={error}
      reset={reset}
      logTag="Mypage"
      title={t("error.title")}
      description={t("error.description")}
      backHref={publishedHomeHref(locale)}
      backLabel={tErrorPage("goHome")}
      retryLabel={tErrorPage("retry")}
    />
  );
}
