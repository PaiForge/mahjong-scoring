import { PageTitleSkeleton } from "@/app/_components/page-title-skeleton";

/** 管理画面のページ見出しの見た目（本物とプレースホルダで共有） */
const ADMIN_PAGE_TITLE_CLASSES =
  "text-lg font-bold tracking-tight text-surface-900";

interface AdminPageTitleProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * 管理画面の各ページ見出し（h2）。
 *
 * セクション全体の見出し（h1「管理画面」）は admin レイアウトのサイドバーが持つため、
 * その配下に来るページ単位の見出しは h2 とする。
 * エンドユーザー向けの PageTitle とは意図的に分離し、中央寄せ・細字ではなく
 * 左寄せ・太字の業務用デザインを維持する。
 */
export function AdminPageTitle({
  children,
  className = "",
}: AdminPageTitleProps) {
  return (
    <h2 className={`${ADMIN_PAGE_TITLE_CLASSES} ${className}`}>{children}</h2>
  );
}

interface AdminPageTitlePlaceholderProps {
  /** プレースホルダ帯の幅（Tailwind の `w-*` クラス） */
  readonly width?: string;
  readonly className?: string;
}

/**
 * 読み込み中の管理画面ページ見出し。
 *
 * `AdminPageTitle` と同じ箱にグレー帯を置く。見出し要素（h2）は名乗らない —
 * 理由はユーザー向けの `PageTitlePlaceholder` と同じ（空の見出しを
 * 本物より先に HTML へ出さない）。
 */
export function AdminPageTitlePlaceholder({
  width = "w-40",
  className = "",
}: AdminPageTitlePlaceholderProps) {
  return (
    <div
      aria-hidden="true"
      className={`${ADMIN_PAGE_TITLE_CLASSES} ${className}`}
    >
      <PageTitleSkeleton width={width} />
    </div>
  );
}
