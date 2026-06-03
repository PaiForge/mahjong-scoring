import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { PrimaryLinkButton } from "@/app/_components/primary-link-button";
import { BookIcon } from "@/app/_components/icons/book-icon";
import { InfinityIcon } from "@/app/_components/icons/infinity-icon";

interface PracticeIntroContentProps {
  /** i18n ネームスペース（例: "jantouFu"） */
  readonly namespace: string;
  /** 練習スラッグ（例: "jantou-fu"） */
  readonly slug: string;
  /** 学習ページへのリンクを表示するかどうか（デフォルト: true） */
  readonly showLearnLink?: boolean;
  /** トレーニングモードへのボタンを表示するかどうか（デフォルト: false） */
  readonly showTraining?: boolean;
}

/**
 * 練習説明ページの共通コンテンツ
 * 練習説明共通
 */
export async function PracticeIntroContent({
  namespace,
  slug,
  showLearnLink = true,
  showTraining = false,
}: PracticeIntroContentProps) {
  const t = await getTranslations(namespace);
  const tc = await getTranslations("challenge");
  const tp = await getTranslations("practice");
  const tt = await getTranslations("training");

  return (
    <ContentContainer
      breadcrumb={[
        { label: tp("title"), href: "/practice" },
        { label: t("title") },
      ]}
    >
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

      {showTraining ? (
        <div className="mt-8 flex flex-col items-center gap-5">
          <div className="flex w-full max-w-xs flex-col items-center gap-1.5">
            <PrimaryLinkButton
              href={`/practice/${slug}/play`}
              className="w-full px-8 py-3"
            >
              {tc("startButton")}
            </PrimaryLinkButton>
            <p className="text-xs text-surface-400">{tp("modeChallengeHint")}</p>
          </div>

          <div className="flex w-full max-w-xs items-center gap-3 text-xs text-surface-400">
            <span className="h-px flex-1 bg-surface-200" />
            <span>{tp("orDivider")}</span>
            <span className="h-px flex-1 bg-surface-200" />
          </div>

          <div className="flex w-full max-w-xs flex-col items-center gap-1.5">
            <Link
              href={`/practice/${slug}/training`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary-500 px-8 py-3 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-50"
            >
              <InfinityIcon className="size-4" />
              {tt("startButton")}
            </Link>
            <p className="text-xs text-surface-400">{tp("modeTrainingHint")}</p>
          </div>
        </div>
      ) : (
        <div className="mt-8 text-center">
          <PrimaryLinkButton href={`/practice/${slug}/play`} className="px-8 py-3">
            {tc("startButton")}
          </PrimaryLinkButton>
        </div>
      )}
    </ContentContainer>
  );
}
