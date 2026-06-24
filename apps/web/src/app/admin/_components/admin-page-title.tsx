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
export function AdminPageTitle({ children, className = "" }: AdminPageTitleProps) {
  return (
    <h2 className={`text-lg font-bold tracking-tight text-surface-900 ${className}`}>
      {children}
    </h2>
  );
}
