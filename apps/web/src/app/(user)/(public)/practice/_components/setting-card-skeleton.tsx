import {
  SETTING_CARD_BODY_CLASS,
  SETTING_CARD_FRAME_CLASS,
  SETTING_CARD_HEADER_CLASS,
} from "./setting-card";

interface SettingCardSkeletonProps {
  /** カード内に確保するチェックボックス行の数（既定 2） */
  readonly rows?: number;
}

/**
 * 設定カードの読み込み中スケルトン
 * 設定カードスケルトン
 *
 * ストアが hydrate されるまでの間、{@link SettingCard} と同じ寸法の枠を
 * 確保して CLS を防ぐ。枠の体裁は SettingCard と同じクラス定数を共有するため、
 * カードの見た目を変えてもスケルトンだけ取り残されることがない。
 */
export function SettingCardSkeleton({ rows = 2 }: SettingCardSkeletonProps) {
  return (
    <div className={SETTING_CARD_FRAME_CLASS}>
      <div className={SETTING_CARD_HEADER_CLASS}>
        <div className="mx-auto h-4 w-20 animate-pulse rounded bg-surface-200" />
      </div>
      <div className={SETTING_CARD_BODY_CLASS}>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-2 py-1.5">
            <div className="size-5 animate-pulse rounded bg-surface-100" />
            <div className="h-4 w-16 animate-pulse rounded bg-surface-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
