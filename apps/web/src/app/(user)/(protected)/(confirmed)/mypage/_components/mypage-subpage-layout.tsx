import { getTranslations } from "next-intl/server";

import type { BreadcrumbItem } from "@/app/(user)/_components/breadcrumb";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";

interface MypageSubpageLayoutProps {
  /** ページの見出し。パンくずの末尾（現在地）にも同じ文言を出す */
  readonly title: string;
  /** マイページと現在地の間に挟むパンくず（例: アカウント設定の下のページ） */
  readonly parents?: readonly BreadcrumbItem[];
  readonly children: React.ReactNode;
}

/**
 * マイページの下位ページの骨組み
 * マイページ下位ページ
 *
 * 「マイページ > … > 見出し」のパンくずを持つ `ContentContainer` と `PageTitle` を組む。
 * `PageTitle` を `ContentContainer` の直接の子に置くので、タイトル帯への引き上げも
 * 各ページの `loading.tsx`（`PageTitlePlaceholder`）との高さの一致も直書きのときと変わらない。
 */
export async function MypageSubpageLayout({
  title,
  parents = [],
  children,
}: MypageSubpageLayoutProps) {
  const tMypage = await getTranslations("mypage");
  return (
    <ContentContainer
      breadcrumb={[
        { label: tMypage("pageTitle"), href: "/mypage" },
        ...parents,
        { label: title },
      ]}
    >
      <PageTitle>{title}</PageTitle>
      {children}
    </ContentContainer>
  );
}
