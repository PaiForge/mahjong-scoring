"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";

export function ResultClient() {
  const searchParams = useSearchParams();
  const tc = useTranslations("challenge");

  const correct = Number(searchParams.get("correct") ?? 0);
  const total = Number(searchParams.get("total") ?? 0);
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <ContentContainer className="flex flex-col items-center">
      <PageTitle>{tc("finished")}</PageTitle>

      <div className="mt-8 w-full max-w-xs rounded-xl border border-surface-200 bg-white p-6 shadow-sm text-center">
        <p className="text-4xl font-bold text-primary-600">
          {tc("resultScore", { correct, total })}
        </p>
        <p className="mt-2 text-sm text-surface-500">
          {tc("resultAccuracy", { accuracy })}
        </p>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/practice/machi-fu/play/session"
          className="rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600"
        >
          {tc("retryButton")}
        </Link>
        <Link
          href="/practice"
          className="rounded-lg border border-surface-200 px-6 py-2.5 text-sm font-semibold text-surface-600 transition-colors hover:bg-surface-100"
        >
          {tc("backToList")}
        </Link>
      </div>
    </ContentContainer>
  );
}
