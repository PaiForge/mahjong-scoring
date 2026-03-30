import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("tehaiFu");
  return {
    title: `${t("title")} - Mahjong Scoring`,
    description: t("description"),
  };
}

export default async function TehaiFuPage() {
  const t = await getTranslations("tehaiFu");
  const tc = await getTranslations("challenge");

  return (
    <ContentContainer>
      <PageTitle>{t("title")}</PageTitle>
      <p className="mt-2 text-sm text-surface-500">{t("description")}</p>

      <div className="mt-8 text-center">
        <Link
          href="/practice/tehai-fu/play"
          className="inline-block rounded-lg bg-primary-500 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600"
        >
          {tc("startButton")}
        </Link>
      </div>
    </ContentContainer>
  );
}
