import { SkeletonBar } from "@/app/_components/skeleton-bar";

import {
  SETTING_CARD_BODY_CLASS,
  SETTING_CARD_FRAME_SHAPE_CLASS,
  SETTING_CARD_HEADER_SHAPE_CLASS,
} from "./setting-card";

/** スケルトンの枠。実物（`SettingCard`）の寸法に灰色を足す */
const SKELETON_FRAME_CLASS = `${SETTING_CARD_FRAME_SHAPE_CLASS} border-surface-100 bg-surface-50`;

/** スケルトンの見出し帯。実物の淡緑（`bg-primary-50`）を灰色に置き換える */
const SKELETON_HEADER_CLASS = `${SETTING_CARD_HEADER_SHAPE_CLASS} border-surface-100 bg-surface-100`;

interface SettingCardSkeletonProps {
  /** カード内に確保するチェックボックス行の数（既定 2） */
  readonly rows?: number;
}

/**
 * 設定カードの読み込み中スケルトン
 * 設定カードスケルトン
 *
 * ストアが hydrate されるまでの間、{@link SettingCard} と同じ寸法の枠を
 * 確保して CLS を防ぐ。寸法は SettingCard と同じクラス定数を共有するため、
 * カードの見た目を変えてもスケルトンだけ取り残されることがない。
 *
 * 色は共有しない。実物の苔緑の枠（`border-ink`）と淡緑の見出し帯
 * （`bg-primary-50`）は写さず灰色にする（`ProblemListSkeleton` と同じ理由 —
 * 読み込み中の画面が実物より賑やかに見えるため）。枠は border-box なので、
 * 色だけ替えても寸法は実物と一致したまま。
 */
export function SettingCardSkeleton({ rows = 2 }: SettingCardSkeletonProps) {
  return (
    <div className={SKELETON_FRAME_CLASS}>
      <div className={SKELETON_HEADER_CLASS}>
        <SkeletonBar className="mx-auto h-4 w-20" />
      </div>
      <div className={SETTING_CARD_BODY_CLASS}>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-2 py-1.5">
            <SkeletonBar radius="sm" className="size-5" tone={100} />
            <SkeletonBar className="h-4 w-16" tone={100} />
          </div>
        ))}
      </div>
    </div>
  );
}
