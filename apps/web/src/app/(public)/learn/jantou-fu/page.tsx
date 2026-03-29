import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("jantouFu");
  return {
    title: `${t("title")} - Mahjong Scoring`,
    description: t("description"),
  };
}

export default async function LearnJantouFuPage() {
  const t = await getTranslations("jantouFu");
  const tc = await getTranslations("challenge");

  return (
    <div className="px-6 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-surface-900">{t("title")}</h1>
        <p className="mt-2 text-sm text-surface-500">{t("description")}</p>

        <div className="mt-6 rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-surface-900">
            {t("rules.title")}
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-surface-600">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 inline-block size-1.5 shrink-0 rounded-full bg-primary-500" />
              {t("rules.yakuhai")}
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 inline-block size-1.5 shrink-0 rounded-full bg-primary-500" />
              {t("rules.renfonpai")}
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 inline-block size-1.5 shrink-0 rounded-full bg-surface-300" />
              {t("rules.other")}
            </li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/practice/jantou-fu/play/session"
            className="inline-block rounded-lg bg-primary-500 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600"
          >
            {tc("startButton")}
          </Link>
        </div>
      </div>
    </div>
  );
}
