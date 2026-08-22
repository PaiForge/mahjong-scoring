"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { useAuth } from "@/app/_contexts/auth-context";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { LinkButton } from "@/app/(user)/_components/link-button";

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
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 p-4 text-center">
          <div>
            <p className="font-semibold text-surface-900">{t("title")}</p>
            <p className="mt-1 text-sm text-surface-600">{t("description")}</p>
          </div>
          <LinkButton href="/sign-up">{t("cta")}</LinkButton>
          <Link
            href="/sign-in?redirect=/preferences"
            className={`text-xs font-semibold ${TEXT_LINK_CLASSES}`}
          >
            {t("signInLink")}
          </Link>
        </div>
      )}
    </div>
  );
}
