import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { chapterHref, type CurriculumChapterSlug } from "../_lib/curriculum";

interface LoginPromptCtaProps {
  /** 対象章のスラッグ（サインイン後のリダイレクト先生成に使用） */
  readonly slug: CurriculumChapterSlug;
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
  const redirectTo = encodeURIComponent(chapterHref(slug));

  return (
    <Link
      href={`/sign-in?redirect=${redirectTo}`}
      className={`text-sm ${TEXT_LINK_CLASSES}`}
    >
      {t("loginPromptCta")}
    </Link>
  );
}
