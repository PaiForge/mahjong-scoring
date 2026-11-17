import { AgariScoreBoardSkeleton } from "@/app/[locale]/(user)/(public)/practice/agari-score/_components/agari-score-board-skeleton";
import { ContentContainer } from "@/app/[locale]/(user)/_components/content-container";
import { PageTitlePlaceholder } from "@/app/[locale]/(user)/_components/page-title";

/**
 * 本日の問題の読み込み中スケルトン
 *
 * 動的ページ（cookie を読む）なので、遷移の待ちにこれを出す。盤面は和了形の
 * 点数計算の盤面と同じ部品なので、その盤面のスケルトン（翻・符・点数の欄つき。
 * 本日の問題の回答フォームは体験ページと同じく翻・符を常に問う）を置く。
 */
export default function Loading() {
  return (
    <ContentContainer fillViewport>
      <PageTitlePlaceholder width="w-32" />
      <AgariScoreBoardSkeleton requireHanFu />
    </ContentContainer>
  );
}
