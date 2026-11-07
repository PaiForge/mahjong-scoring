"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

// 言語レイアウト直下は (user) 配下ではないが、ユーザーに見える画面なので
// ブランド UI のボタンを使う。
import { buttonClasses } from "@/app/[locale]/(user)/_components/_lib/button-classes";
import { Button } from "@/app/[locale]/(user)/_components/button";
import { resolvePublishedHref } from "@/i18n/navigation";

/**
 * 言語レイアウト直下のエラー境界
 *
 * (user) シェル（`(user)/layout.tsx` のヘッダー・フッター）自体が落ちたときに、
 * シェルの代わりに出る。`<html>` と `NextIntlClientProvider` は言語レイアウトが
 * 持ったまま残るので、文言は `errorPage` 名前空間から引く（英語は完訳）。
 * (user) 配下のページのエラーは `(user)/error.tsx` が先に受ける。言語レイアウト
 * そのものが落ちたときは `app/global-error.tsx` が受ける。
 */
export default function LocaleError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  const t = useTranslations("errorPage");
  const locale = useLocale();

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-50 px-6">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-surface-900 mb-3">
          {t("title")}
        </h1>
        <p className="text-sm text-surface-600 mb-8">{t("description")}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button onClick={reset}>{t("retry")}</Button>
          {/* その言語のトップが未公開なら日本語のトップへ（404 へ案内しない） */}
          <Link
            href={resolvePublishedHref("/", locale) ?? "/"}
            className={buttonClasses({ variant: "neutral" })}
          >
            {t("goHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
