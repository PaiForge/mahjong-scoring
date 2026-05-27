import Link from "next/link";

import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { PrimaryLinkButton } from "@/app/_components/primary-link-button";

/**
 * Not Found
 *
 * 該当するルートが存在しない場合に表示される 404 ページ。
 * notFound() からも呼び出される。
 */
export default function NotFound() {
  return (
    <ContentContainer>
      <div className="flex flex-col items-center text-center py-12">
        <p className="text-6xl font-light text-surface-400 mb-4">404</p>
        <PageTitle className="mb-3">ページが見つかりません</PageTitle>
        <p className="text-sm text-surface-600 mb-8">
          お探しのページは削除されたか、URL が変更された可能性があります。
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <PrimaryLinkButton href="/">ホームへ戻る</PrimaryLinkButton>
          <Link
            href="/practice"
            className="inline-flex items-center justify-center rounded-lg border border-surface-300 px-6 py-2.5 text-sm font-semibold text-surface-700 transition-colors hover:bg-surface-100"
          >
            練習一覧へ
          </Link>
        </div>
      </div>
    </ContentContainer>
  );
}
