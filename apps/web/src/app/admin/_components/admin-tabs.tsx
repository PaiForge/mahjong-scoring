import Link from "next/link";

export interface AdminTab {
  readonly href: string;
  readonly label: string;
  readonly current: boolean;
}

/**
 * 同じ一覧を切り替えるページ内のタブ
 * 管理画面タブ
 *
 * タブは URL（クエリ）で表し、リンクで切り替える — 再読み込みや共有で同じ
 * タブに戻れるように。今のタブはサイドナビと同じく `aria-current` で示す。
 */
export function AdminTabs({
  tabs,
  label,
}: {
  readonly tabs: readonly AdminTab[];
  /** タブの並びの名前（スクリーンリーダー向け） */
  readonly label: string;
}) {
  return (
    <nav aria-label={label} className="admin-tabs">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.current ? "page" : undefined}
          className="admin-tab"
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
