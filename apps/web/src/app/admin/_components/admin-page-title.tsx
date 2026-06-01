interface AdminPageTitleProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * 管理画面用のページ見出し（h1）。
 *
 * エンドユーザー向けの PageTitle とは意図的に分離している。
 * 管理画面は業務用 UI のため、中央寄せ・細字のエンドユーザー用デザインではなく
 * 左寄せ・太字の従来スタイルを維持する。
 */
export function AdminPageTitle({ children, className = "" }: AdminPageTitleProps) {
  return (
    <h1 className={`text-lg font-bold tracking-tight text-surface-900 ${className}`}>
      {children}
    </h1>
  );
}
