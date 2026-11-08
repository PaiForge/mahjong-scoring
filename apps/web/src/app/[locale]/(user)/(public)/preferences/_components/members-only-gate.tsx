"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { useAuth } from "@/app/_contexts/auth-context";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { SUB_LINK_GAP } from "@/app/_components/_lib/spacing";
import { LinkButton } from "@/app/[locale]/(user)/_components/link-button";

/**
 * 会員限定ゲートの導線の張る先（ページの言語の最終 href）
 *
 * ページ（サーバー）が `membersGateLinks()` で組んで渡す。この部品は
 * クライアントで描かれるので、公開状態を読まない。
 */
export interface MembersGateLinks {
  /** 会員登録 */
  readonly signUpHref: string;
  /** ログイン（ログイン後にこのページへ戻す `?redirect=` 付き） */
  readonly signInHref: string;
}

/**
 * 会員限定ゲート（スモーク）
 *
 * 設定項目は会員登録への導線（CTA）も兼ねる。未ログイン時は中身を
 * スモーク（ぼかし＋減光）で覆って操作を無効化し、その上に会員登録 CTA を重ねる。
 * ログイン状態の確定前（読み込み中）は誤操作防止のため操作だけ無効化し、CTA は出さない。
 *
 * 会員登録・ログインはページと同じ言語で張る（英語の設定ページからは英語の
 * 登録・ログインへ。ログイン後は同じ言語のこのページへ戻す）。
 */
export function MembersOnlyGate({
  children,
  links,
}: {
  readonly children: ReactNode;
  /** 会員登録・ログインの張る先 */
  readonly links: MembersGateLinks;
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
        <div
          className={`absolute inset-0 z-10 flex flex-col items-center justify-center ${SUB_LINK_GAP} p-4 text-center`}
        >
          <div>
            <p className="font-semibold text-surface-900">{t("title")}</p>
            <p className="mt-1 text-sm text-surface-600">{t("description")}</p>
          </div>
          <LinkButton href={links.signUpHref}>{t("cta")}</LinkButton>
          <Link
            href={links.signInHref}
            className={`text-xs font-semibold ${TEXT_LINK_CLASSES}`}
          >
            {t("signInLink")}
          </Link>
        </div>
      )}
    </div>
  );
}
