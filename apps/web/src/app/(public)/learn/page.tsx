import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { createMetadata } from "@/app/_lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("learnIndex");
  return createMetadata({ title: t("pageTitle"), description: t("pageDescription") });
}

const learnPages = [
  { href: "/learn/introduction", titleKey: "introduction" },
  { href: "/learn/jantou-fu", titleKey: "jantouFu" },
  { href: "/learn/mentsu-fu", titleKey: "mentsuFu" },
  { href: "/learn/machi-fu", titleKey: "machiFu" },
  { href: "/learn/tehai-fu", titleKey: "tehaiFu" },
  { href: "/learn/yaku", titleKey: "yaku" },
] as const;

export default async function LearnIndexPage() {
  const t = await getTranslations("learnIndex");

  return (
    <ContentContainer>
      <PageTitle>{t("pageTitle")}</PageTitle>
      <p className="mt-2 text-sm text-surface-500">{t("pageDescription")}</p>

      <ul className="mt-8 space-y-4">
        {learnPages.map((page) => (
          <li key={page.href}>
            <Link
              href={page.href}
              className="text-sm font-medium text-primary-600 underline-offset-2 hover:underline"
            >
              {t(page.titleKey)}
            </Link>
          </li>
        ))}
      </ul>
    </ContentContainer>
  );
}
