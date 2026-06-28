"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { useAuth } from "@/app/_contexts/auth-context";

/**
 * 会員限定ゲート（スモーク）
 *
 * 設定項目は会員登録への導線（CTA）も兼ねる。未ログイン時は中身を
 * スモーク（ぼかし＋減光）で覆って操作を無効化し、その上に会員登録 CTA を重ねる。
 * ログイン状態の確定前（読み込み中）は誤操作防止のため操作だけ無効化し、CTA は出さない。
 */
export function MembersOnlyGate({
  children,
}: {
  readonly children: ReactNode;
}) {
  const t = useTranslations("settings.membersGate");
  const { user, isLoading } = useAuth();
  const locked = !user;
  const showCta = !isLoading && !user;

  return (
    <div className={locked ? "relative min-h-56" : "relative"}>
      <div
        inert={locked}
        className={locked ? "select-none opacity-50 blur-[2px]" : undefined}
      >
        {children}
      </div>

      {showCta && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/30 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-sm rounded-lg border border-primary-200 bg-primary-50/95 p-5 text-center shadow-sm">
            <p className="font-semibold text-surface-900">{t("title")}</p>
            <p className="mt-1 text-sm text-surface-600">{t("description")}</p>
            <Link
              href="/sign-up"
              className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600"
            >
              {t("cta")}
            </Link>
            <Link
              href="/sign-in?redirect=/preferences"
              className="mt-2 inline-block text-xs font-semibold text-primary-600 hover:underline"
            >
              {t("signInLink")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
