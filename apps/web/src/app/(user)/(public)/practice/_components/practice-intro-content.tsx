import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { PrimaryLinkButton } from "@/app/_components/primary-link-button";
import { BookIcon } from "@/app/_components/icons/book-icon";

interface PracticeIntroContentProps {
  /** i18n ネームスペース（例: "jantouFu"） */
  readonly namespace: string;
  /** 練習スラッグ（例: "jantou-fu"） */
  readonly slug: string;
  /** 学習ページへのリンクを表示するかどうか（デフォルト: true） */
  readonly showLearnLink?: boolean;
}

/**
 * 練習説明ページの共通コンテンツ
 * 練習説明共通
 */
export async function PracticeIntroContent({
  namespace,
  slug,
  showLearnLink = true,
}: PracticeIntroContentProps) {
  const t = await getTranslations(namespace);
  const tc = await getTranslations("challenge");

  return (
    <ContentContainer>
      <PageTitle>{t("title")}</PageTitle>
      <p className="mt-3 text-sm text-surface-500">{t("description")}</p>

      {showLearnLink && (
        <div className="mt-6 flex items-center gap-2 text-sm">
          <BookIcon className="size-4 text-primary-600" />
          <Link
            href={`/learn/${slug}`}
            className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            {t("learnLink")}
          </Link>
        </div>
      )}

      <div className="mt-8 text-center">
        <PrimaryLinkButton href={`/practice/${slug}/play`} className="px-8 py-3">
          {tc("startButton")}
        </PrimaryLinkButton>
      </div>
    </ContentContainer>
  );
}
