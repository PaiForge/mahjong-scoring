import { type ReactNode } from "react";

interface BoardOverlayProps {
  readonly children?: ReactNode;
  readonly className?: string;
  readonly isVisible?: boolean;
}

/**
 * ボードオーバーレイ
 *
 * 親要素を覆う半透明オーバーレイ。ポーズ画面などで使用する。
 * `pointer-events-none` を基本とし、子要素は `pointer-events-auto` で操作可能にする。
 */
export function BoardOverlay({
  children,
  className = "",
  isVisible = true,
}: BoardOverlayProps) {
  if (!isVisible) return undefined;

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center bg-black/30 rounded-md z-50 pointer-events-none ${className}`}
    >
      <div className="pointer-events-auto flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
