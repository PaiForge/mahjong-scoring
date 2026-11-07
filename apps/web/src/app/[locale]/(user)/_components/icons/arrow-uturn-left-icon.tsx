import { OutlineIcon } from "./outline-icon";

interface ArrowUturnLeftIconProps {
  readonly className?: string;
}

/**
 * 左へ U ターンする矢印アイコン（↩︎）
 * 戻るアイコン
 *
 * 「前の画面へ戻ってやり直す」導線に使う。歯車の `SettingsIcon` は
 * グローバルナビの設定ページ（/preferences）が使っているため、練習の出題設定へ
 * 戻す導線にはこちらを使い、アプリ全体の設定と混同させない。
 */
export function ArrowUturnLeftIcon({
  className = "size-5",
}: ArrowUturnLeftIconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
    </OutlineIcon>
  );
}
