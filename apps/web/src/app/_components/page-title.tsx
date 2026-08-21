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

export function PageTitle({
  children,
  className = "",
  action,
}: PageTitleProps) {
  const heading = (
    <h1
      aria-live="polite"
      // 見出しは白カードの外（斜線の地の上）に置かれる。foreground のスレート系だと
      // 緑がかった地から浮くため、地と同系の深緑（primary-900）を使う。
      className={`text-xl md:text-2xl font-bold text-primary-900 text-center ${className}`}
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
