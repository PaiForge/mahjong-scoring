import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { buildSignInHref } from "@/lib/redirect";
import { chapterHref } from "@mahjong-scoring/features/routes";
import type { CurriculumChapterSlug } from "@mahjong-scoring/features/curriculum/registry";

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

  return (
    <Link
      href={buildSignInHref(chapterHref(slug))}
      className={`text-sm ${TEXT_LINK_CLASSES}`}
    >
      {t("loginPromptCta")}
    </Link>
  );
}
