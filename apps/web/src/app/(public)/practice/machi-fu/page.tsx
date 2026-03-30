import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("machiFu");
  return {
    title: `${t("title")} - Mahjong Scoring`,
    description: t("description"),
  };
}

export default async function MachiFuPage() {
  const t = await getTranslations("machiFu");
  const tc = await getTranslations("challenge");

  return (
    <ContentContainer>
      <PageTitle>{t("title")}</PageTitle>
      <p className="mt-2 text-sm text-surface-500">{t("description")}</p>

      <div className="mt-6 flex items-center gap-2 text-sm">
        <svg className="size-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <Link
          href="/learn/machi-fu"
          className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
        >
          {t("learnLink")}
        </Link>
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/practice/machi-fu/play/session"
          className="inline-block rounded-lg bg-primary-500 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600"
        >
          {tc("startButton")}
        </Link>
      </div>
    </ContentContainer>
  );
}
