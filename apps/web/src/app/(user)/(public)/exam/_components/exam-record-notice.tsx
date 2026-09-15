"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { useAuth } from "@/app/_contexts/auth-context";

/**
 * 昇級試験の説明ページで、未ログイン時に段級位が記録されないことを開始前に伝える注意書き
 * 未ログイン時の記録注意
 *
 * @description
 * 合格条件パネル（{@link import("./exam-conditions").ExamConditions}）の直後に置く。
 * 開始ボタンを押す前に必ず目に入る位置で、合格しても段級位が記録されないことを
 * 先に伝える。文言は道場（`/dojo`）の「現在の段級位」カードが未ログイン時に出す
 * 注意書き（`dojo.signInNote` / `dojo.signInLink`）をそのまま引く — 同じ事実を
 * 練習ごとに違う言葉で言い直さないため。
 *
 * ログイン状態はクライアント側の `AuthProvider` から取る。説明ページの静的配信を
 * 保つため（サーバーで cookie を読むとページ全体が動的レンダリングに落ちる）、
 * このコンポーネント自身が Client Component として解決を担う
 * （{@link import("./exam-start-gate").ExamStartGate} と同じ理由）。認証状態の
 * 解決中とログイン済みは何も表示しない — 事後に登録を促す導線
 * （結果ページの `SignUpCta`）は別に存在するため、ここは開始前の注意書きに徹する。
 */
export function ExamRecordNotice() {
  const t = useTranslations("dojo");
  const { user, isLoading } = useAuth();

  if (isLoading || user) return null;

  return (
    <p className="text-sm text-surface-500">
      {t("signInNote")}{" "}
      <Link href="/sign-in" className={TEXT_LINK_CLASSES}>
        {t("signInLink")}
      </Link>
    </p>
  );
}
