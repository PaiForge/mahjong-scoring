import type { ReactNode } from "react";
import { SettingCardSkeleton } from "../../_components/setting-card-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";

/**
 * 点数計算練習の設定画面の読み込み中の形
 * 練習設定スケルトン
 *
 * 本体と同じ構造（設定カード＝トグル行、2カラムのチェックボックスカード、
 * フル幅ボタン）で描き、実 UI 表示時の CLS を防ぐ。
 * 最後の行（回答時間の計測）は Pro でない閲覧者が多数なので、ロック行の
 * 高さ（見出し・利用条件・料金ページへのリンクの 3 段）に合わせる。
 * 翻数と符の細目の 2 行（5翻以上・満貫以上の符）は、既定（翻数と符を
 * 答えない）では出ないので数えない。
 * 枠は実 UI と同じ細枠（border-panel）のまま、面を灰色にする。枠は
 * border-box なので寸法は実 UI と一致したまま。
 */
export function ScoreSetupFormSkeleton({
  showYakuFilter,
  children,
}: {
  readonly showYakuFilter: boolean;
  /** 開始ボタンの下の注記。静的なテキストなのでスケルトンでもそのまま描く（mounted の前後で高さが変わらない） */
  readonly children?: ReactNode;
}) {
  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      {/* 回答する項目: トグル 2 行 */}
      <SettingCardSkeleton>
        {["requireYaku", "requireHanFu"].map((key, i) => (
          <ToggleRowSkeleton key={key} isLast={i === 1} />
        ))}
      </SettingCardSkeleton>

      {/* 練習の補助: トグル 1 行 + 回答時間の計測のロック行 */}
      <SettingCardSkeleton>
        <ToggleRowSkeleton />
        <div className="px-5 py-3.5">
          <div className="flex h-5 items-center justify-between">
            <SkeletonBar className="h-4 w-32" tone={100} />
            <SkeletonBar radius="full" className="h-4 w-10" tone={100} />
          </div>
          <div className="mt-1 flex h-4 items-center">
            <SkeletonBar className="h-3 w-40" tone={100} />
          </div>
          <div className="mt-1 flex h-4 items-center justify-end">
            <SkeletonBar className="h-3 w-20" tone={100} />
          </div>
        </div>
      </SettingCardSkeleton>

      {/* Grid: 出題モード / 点数範囲 の2カード（ヘッダー＋チェックボックス2行） */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {["questionMode", "targetScore"].map((key) => (
          <SettingCardSkeleton key={key} />
        ))}
      </div>

      {/* 出題する役カード（ヘッダー＋MultiSelect の追加ボタン相当） */}
      {showYakuFilter && <SettingCardSkeleton />}

      {/* Full-width start button（Button size="lg" の実寸 = 枠込み 46px） */}
      <div>
        <SkeletonBar radius="lg" className="h-[46px] w-full" />
      </div>

      {children}
    </div>
  );
}

/** トグル行（{@link SettingToggle}）の読み込み中の形 */
function ToggleRowSkeleton({ isLast = false }: { readonly isLast?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between px-5 py-3.5 ${isLast ? "" : "border-b border-surface-100"}`}
    >
      <SkeletonBar className="h-4 w-32" tone={100} />
      <SkeletonBar radius="full" className="h-6 w-11" tone={100} />
    </div>
  );
}
