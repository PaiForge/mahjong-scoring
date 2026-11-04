import type { ReactNode } from "react";

interface LoginMethodRowProps {
  /** 手段の名前（「Google アカウント」等） */
  readonly title: string;
  /** 状態や連携先のアドレス（「設定済み」「a@gmail.com」） */
  readonly detail?: string;
  /** 操作できない理由など、行の下に添える注記 */
  readonly note?: string;
  /** 右端のボタン */
  readonly action: ReactNode;
}

/**
 * ログイン方法 1 つの行
 * ログイン方法の行
 *
 * `SettingsCard` の中に並べる。左に名前と状態、右に操作のボタン 1 つ。
 * 設定のトグル行（`SettingToggleRow`）と同じ余白で、スイッチの位置に
 * ボタンが入る。
 */
export function LoginMethodRow({
  title,
  detail,
  note,
  action,
}: LoginMethodRowProps) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <span className="min-w-0">
          <span className="block text-sm font-medium text-surface-900">
            {title}
          </span>
          {detail !== undefined && (
            <span className="mt-0.5 block break-all text-xs text-surface-500">
              {detail}
            </span>
          )}
        </span>
        <span className="shrink-0">{action}</span>
      </div>
      {note !== undefined && (
        <p className="mt-2 text-xs leading-relaxed text-surface-500">{note}</p>
      )}
    </div>
  );
}
