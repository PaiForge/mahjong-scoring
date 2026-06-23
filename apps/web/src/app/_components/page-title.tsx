interface PageTitleProps {
  children: React.ReactNode;
  className?: string;
  /**
   * タイトルの右隣に並べる操作要素（ヘルプボタン等）。
   * 指定時はタイトルと1グループとして中央寄せする（blindfold-chess の PageLayout 準拠）。
   * `transform` を使う配置は子孫の `position: fixed`（モーダル等）の基準を壊すため避ける。
   */
  action?: React.ReactNode;
}

export function PageTitle({ children, className = "", action }: PageTitleProps) {
  const heading = (
    <h1
      aria-live="polite"
      className={`text-lg md:text-xl font-light text-foreground text-center ${className}`}
    >
      {children}
    </h1>
  );

  if (!action) return heading;

  return (
    <div className="flex items-center justify-center gap-2">
      {heading}
      {action}
    </div>
  );
}
