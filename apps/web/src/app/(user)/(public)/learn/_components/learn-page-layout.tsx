import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { PrimaryLinkButton } from "@/app/_components/primary-link-button";

interface LearnPageLayoutProps {
  /** i18n ネームスペース（例: "jantouFu.learn"） */
  readonly namespace: string;
  /** ドリルプレイページへのリンク（例: "/practice/jantou-fu/play"） */
  readonly playHref?: string;
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

      {playHref && (
        <div className="mt-10 text-center">
          <PrimaryLinkButton href={playHref} className="px-8 py-3">
            {t("ctaDrill")}
          </PrimaryLinkButton>
        </div>
      )}
    </ContentContainer>
  );
}
