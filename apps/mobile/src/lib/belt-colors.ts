import type { RankSlug } from "@mahjong-scoring/features/ranks/registry";

/** 段級位の帯色 */
interface BeltColors {
  /** 帯そのものの色（ピルの塗り・枠） */
  readonly fill: string;
  /** 帯色の淡い面 */
  readonly tint: string;
  /** 淡い面に載せる文字 */
  readonly tintText: string;
}

/**
 * 段級位ごとの帯色
 * 帯色
 *
 * web の `lib/ranks/belt-colors.ts`（Tailwind の色名）と同じ色を hex で持つ。
 * 5級オレンジ → 4級青 → 3級黄 → 2級緑 → 1級茶 → 初段黒。
 */
export const RANK_BELT_COLORS: Readonly<Record<RankSlug, BeltColors>> = {
  "kyu-5": { fill: "#f97316", tint: "#ffedd5", tintText: "#9a3412" },
  "kyu-4": { fill: "#3b82f6", tint: "#dbeafe", tintText: "#1e40af" },
  "kyu-3": { fill: "#eab308", tint: "#fef9c3", tintText: "#854d0e" },
  "kyu-2": { fill: "#22c55e", tint: "#dcfce7", tintText: "#166534" },
  "kyu-1": { fill: "#92400e", tint: "#fde68a", tintText: "#78350f" },
  "dan-1": { fill: "#1c1917", tint: "#e7e5e4", tintText: "#1c1917" },
};
