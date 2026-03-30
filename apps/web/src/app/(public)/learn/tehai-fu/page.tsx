import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { TehaiFuGuide } from "./_components/tehai-fu-guide";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("tehaiFu.learn");
  return {
    title: `${t("pageTitle")} - Mahjong Scoring`,
    description: t("pageDescription"),
  };
}

export default async function LearnTehaiFuPage() {
  const t = await getTranslations("tehaiFu.learn");

  return (
    <ContentContainer>
      <PageTitle>{t("pageTitle")}</PageTitle>

      <div className="mt-6">
        <TehaiFuGuide />
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/practice/tehai-fu/play"
          className="inline-block rounded-lg bg-primary-500 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600"
        >
          {t("ctaDrill")}
        </Link>
      </div>
    </ContentContainer>
  );
}
