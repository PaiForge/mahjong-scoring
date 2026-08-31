import { SkeletonBar } from "@/app/_components/skeleton-bar";

import { DESKTOP_WEEKS } from "../_lib/heatmap-utils";

/**
 * モバイルのバーチャート用プレースホルダの高さ。
 *
 * 実描画は当日までの EXP に応じて毎回変わるが、スケルトンは SSR/CSR で
 * 一致する必要があるため乱数を使わず固定値を並べる。ラベル（上下 16px）と
 * gap（4px × 2）を足しても `HeatmapBarChart` と同じ 140px の枠に収まる。
 * Tailwind はリテラルなクラス名しか検出しないため、数値からクラスを組み立てない。
 */
const BAR_HEIGHT_CLASSES = [
  "h-[52px]",
  "h-[88px]",
  "h-[36px]",
  "h-[100px]",
  "h-[64px]",
  "h-[76px]",
  "h-[44px]",
] as const;

/** 凡例の色見本の数（`ExpActivityHeatmap` の 0–4 と対応） */
const LEGEND_LEVELS = [0, 1, 2, 3, 4] as const;

/**
 * EXP アクティビティヒートマップのスケルトン
 * ヒートマップスケルトン
 *
 * `ExpActivityHeatmap` と同じ構造（デスクトップのマス目グリッド / モバイルの
 * 7 日バーチャート / 凡例 / 詳細パネル）を同じ寸法で描画し、データ到着時に
 * レイアウトが動かないようにする。マス目のトーンは活動なし（レベル 0）の
 * `bg-surface-200` と同じで、実描画の「まだ塗られていない状態」に一致する。
 *
 * 詳細パネルの枠は実物の苔緑（`border-ink`）を写さず灰色にする。スケルトンは
 * 灰色の矩形だけで面を示す（`ProblemListSkeleton` と同じ理由 — 読み込み中の
 * 画面が実物より賑やかに見えるため）。枠は border-box なので、色だけ替えても
 * 高さは実物と一致したまま。
 */
export function HeatmapSkeleton() {
  return (
    <div className="space-y-3">
      {/* デスクトップ: 46 週グリッド */}
      <div className="hidden overflow-x-auto md:flex md:justify-center">
        <div
          className="inline-grid"
          style={{ gridTemplateColumns: "auto 1fr" }}
        >
          {/* 曜日ラベル列の幅（text-xs の 1 文字 + pr-1.5）を予約する */}
          <div className="w-[18px]" />
          {/* 月ラベル行。文字は出さず高さだけ確保する */}
          <div className="flex gap-[3px]">
            {Array.from({ length: DESKTOP_WEEKS }, (_, weekIdx) => (
              <div key={weekIdx} className="size-3" />
            ))}
          </div>

          {Array.from({ length: 7 }, (_row, dayIdx) => (
            <div key={dayIdx} className="contents">
              <div className="h-3 w-[18px]" />
              <div className="flex gap-[3px]">
                {Array.from({ length: DESKTOP_WEEKS }, (_, weekIdx) => (
                  <SkeletonBar key={weekIdx} radius="sm" className="size-3" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* モバイル: 直近 7 日間のバーチャート */}
      <div className="block md:hidden">
        <div className="flex h-[140px] items-end gap-2">
          {BAR_HEIGHT_CLASSES.map((heightClass, index) => (
            <div
              key={index}
              className="flex flex-1 flex-col items-center gap-1"
            >
              {/* EXP 値（text-xs = 16px 行） */}
              <SkeletonBar className="h-4 w-5" />
              <SkeletonBar radius="sm" className={`w-full ${heightClass}`} />
              {/* 日付ラベル（text-xs = 16px 行） */}
              <SkeletonBar className="h-4 w-8" />
            </div>
          ))}
        </div>
      </div>

      {/* 凡例 — デスクトップのみ。実描画は text-xs の行なので高さ 16px */}
      <div className="hidden h-4 items-center justify-end gap-1.5 md:flex">
        <SkeletonBar className="h-3 w-4" />
        {LEGEND_LEVELS.map((level) => (
          <SkeletonBar key={level} radius="sm" className="size-3" />
        ))}
        <SkeletonBar className="h-3 w-4" />
      </div>

      {/* 詳細パネル。実描画は未選択時もプレースホルダ文を出すため枠ごと再現する */}
      <div className="rounded-lg border-3 border-surface-100 bg-surface-50 p-4">
        <div className="flex h-5 items-center">
          <SkeletonBar className="h-3.5 w-full max-w-[264px]" />
        </div>
        {/* プレースホルダ文はモバイル幅で 2 行に折り返す */}
        <div className="flex h-5 items-center sm:hidden">
          <SkeletonBar className="h-3.5 w-10" />
        </div>
      </div>
    </div>
  );
}
