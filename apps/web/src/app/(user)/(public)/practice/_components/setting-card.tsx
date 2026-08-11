import type { ReactNode } from "react";

interface SettingCardProps {
  readonly title: string;
  readonly children: ReactNode;
}

/**
 * 出題設定のカード
 * 設定カード
 *
 * 見出し帯 + 縦並びのチェックボックス群。点数計算・点数表早引きの
 * 設定パネルで共通。
 */
export function SettingCard({ title, children }: SettingCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-surface-200 bg-white">
      <div className="border-b border-surface-200 bg-surface-50 px-4 py-3">
        <h3 className="text-center text-sm font-bold text-surface-700">
          {title}
        </h3>
      </div>
      <div className="flex flex-col gap-3 p-3">{children}</div>
    </div>
  );
}
