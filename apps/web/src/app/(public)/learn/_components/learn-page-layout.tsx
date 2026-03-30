import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";

interface LearnPageLayoutProps {
  /** i18n ネームスペース（例: "jantouFu.learn"） */
  readonly namespace: string;
  /** ドリルプレイページへのリンク（例: "/practice/jantou-fu/play"） */
  readonly playHref: string;
  /** ガイドコンテンツ */
  readonly children: ReactNode;
}

/**
 * 学習ページの共通レイアウト
 */
export async function LearnPageLayout({ namespace, playHref, children }: LearnPageLayoutProps) {
  const t = await getTranslations(namespace);

  return (
    <ContentContainer>
      <PageTitle>{t("pageTitle")}</PageTitle>

      <div className="mt-6">
        {children}
      </div>

      <div className="mt-10 text-center">
        <Link
          href={playHref}
          className="inline-block rounded-lg bg-primary-500 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600"
        >
          {t("ctaDrill")}
        </Link>
      </div>
    </ContentContainer>
  );
}
