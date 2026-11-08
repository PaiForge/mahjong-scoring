"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { localizedHref } from "@/i18n/public-path";

import { usePageLocale } from "./use-page-locale";

/** 今の言語のまま遷移するルーター（`push` / `replace` だけ） */
export interface LocalizedRouter {
  /** ロケール非依存の href へ、今の言語のまま遷移する */
  readonly push: (href: string) => void;
  /** ロケール非依存の href へ、今の言語のまま履歴を置き換えて遷移する */
  readonly replace: (href: string) => void;
}

/**
 * 今の言語のまま遷移する練習のルーター
 * 言語保持ルーター
 *
 * play → result・終了・設定への戻りのように、練習の盤面から `router.push` で
 * 移る先はロケール非依存の href（`practiceResultHref(slug)` 等）で組む。素の
 * `next/navigation` の `push` に渡すと英語の play から日本語の result へ落ちる。
 * ここで今の言語の公開 URL（日本語は恒等、英語は `/en` 付き）にしてから渡す。
 * 行き先はどれも練習・試験の画面で、play を公開している言語では公開している。
 *
 * `@/i18n/navigation` の `useRouter` と同じ結果になるが、あちらは use-intl の
 * Provider を要求し、next-intl を差し替えた盤面のテストで描けなくなる。
 * 言語の取り方は {@link usePageLocale}（URL から読む）。
 */
export function useLocalizedRouter(): LocalizedRouter {
  const router = useRouter();
  const locale = usePageLocale();
  return useMemo(
    () => ({
      push: (href: string) => router.push(localizedHref(href, locale)),
      replace: (href: string) => router.replace(localizedHref(href, locale)),
    }),
    [router, locale],
  );
}
