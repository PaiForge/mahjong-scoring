"use client";

import { useLocale, useTranslations } from "next-intl";

import { ErrorFallback } from "@/app/[locale]/(user)/_components/error-fallback";
import { publishedHomeHref } from "@/i18n/translated-publications";

/**
 * (user) シェル内のエラー境界
 *
 * サイドバー / フッター等のナビゲーションは (user)/layout.tsx 側で
 * 維持されたまま、コンテンツ領域だけエラー表示に差し替わる。
 *
 * 文言は `errorPage` 名前空間（英語は完訳）。この境界は言語レイアウトの
 * `NextIntlClientProvider` の内側にあるので辞書を引ける。ホームへのリンクはその言語のトップが未公開なら日本語のトップへ向ける
 * （404 へ案内しない）。公開状態はクライアントから読める軽い表
 * （`translated-publications.ts`）から引く。
 */
export default function UserError({
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
      title={t("title")}
      description={t("description")}
      backHref={publishedHomeHref(locale)}
      backLabel={t("goHome")}
    />
  );
}
