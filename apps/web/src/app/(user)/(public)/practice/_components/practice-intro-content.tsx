import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { BookIcon } from "@/app/_components/icons/book-icon";

interface PracticeIntroContentProps {
  /** i18n ネームスペース（例: "jantouFu"） */
  readonly namespace: string;
  /** ドリルスラッグ（例: "jantou-fu"） */
  readonly slug: string;
  /** 学習ページへのリンクを表示するかどうか（デフォルト: true） */
  readonly showLearnLink?: boolean;
}

/**
 * ドリル説明ページの共通コンテンツ
 * ドリル説明共通
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
        <Link
          href={`/practice/${slug}/play`}
          className="inline-block rounded-lg bg-primary-500 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600"
        >
          {tc("startButton")}
        </Link>
      </div>
    </ContentContainer>
  );
}
