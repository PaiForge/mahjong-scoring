import Link from "next/link";
import { getTranslations } from "next-intl/server";

interface LoginPromptCtaProps {
  /** 対象章のスラッグ（サインイン後のリダイレクト先生成に使用） */
  readonly slug: string;
}

/**
 * 未認証ユーザー向けの「読了を記録するにはログイン」CTA
 * ログイン導線CTA
 *
 * サインインページへ `?redirect=/learn/<slug>` 付きで誘導し、
 * 認証後に同じ章ページへ戻れるようにする。
 */
export async function LoginPromptCta({ slug }: LoginPromptCtaProps) {
  const t = await getTranslations("learnCurriculum.chapter");
  const redirectTo = encodeURIComponent(`/learn/${slug}`);

  return (
    <Link
      href={`/sign-in?redirect=${redirectTo}`}
      className="inline-flex items-center justify-center rounded-lg border border-surface-300 bg-white px-6 py-2.5 text-sm font-semibold text-surface-700 transition-colors hover:bg-surface-50"
    >
      {t("loginPromptCta")}
    </Link>
  );
}
