import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { JantouFuGuide } from "./_components/jantou-fu-guide";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("jantouFu.learn");
  return {
    title: `${t("pageTitle")} - Mahjong Scoring`,
    description: t("pageDescription"),
  };
}

export default async function LearnJantouFuPage() {
  const t = await getTranslations("jantouFu.learn");

  return (
    <div className="px-6 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-surface-900">{t("pageTitle")}</h1>

        <div className="mt-6">
          <JantouFuGuide />
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/practice/jantou-fu/play/session"
            className="inline-block rounded-lg bg-primary-500 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600"
          >
            {t("ctaDrill")}
          </Link>
        </div>
      </div>
    </div>
  );
}
