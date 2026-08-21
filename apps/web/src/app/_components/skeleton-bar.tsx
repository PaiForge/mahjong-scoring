import type { ReactNode } from "react";

/**
 * スケルトンの濃さ
 *
 * Tailwind はソース中のリテラルなクラス名しか検出しないため、
 * `bg-surface-${tone}` のような動的生成をしてはいけない。
 */
const TONE_CLASS = {
  50: "bg-surface-50",
  100: "bg-surface-100",
  200: "bg-surface-200",
  300: "bg-surface-300",
} as const;

/**
 * スケルトンの角丸
 *
 * 実描画の形に対応させる。素の `rounded` は Tailwind の非推奨トークン
 * `--radius`（0.25rem 固定）を見ており `globals.css` で取り直した
 * `--radius-*` の影響を受けないため、スケルトンでは使わない。
 * ここを経由させておけば `data-skin="plain"` の角丸にも自動で追従する。
 */
const RADIUS_CLASS = {
  /** 文字列や小さな矩形。既定 */
  md: "rounded-md",
  /** ボタン・入力欄（`primary-link-button` と同じ） */
  lg: "rounded-lg",
  /** カード・リスト行（`list-link` / `data-table` と同じ） */
  xl: "rounded-xl",
  /** pill・円（アバター、トグル、細いバー） */
  full: "rounded-full",
} as const;

/** スケルトンの濃さ。数字が大きいほど濃い */
export type SkeletonTone = keyof typeof TONE_CLASS;

/** スケルトンの角丸。実描画の形に合わせて選ぶ */
export type SkeletonRadius = keyof typeof RADIUS_CLASS;

interface SkeletonBarProps {
  /** この矩形固有のクラス（高さ・幅・余白など）。角丸は `radius` で指定する */
  readonly className: string;
  /** 濃さ（既定 200） */
  readonly tone?: SkeletonTone;
  /** 角丸（既定 md） */
  readonly radius?: SkeletonRadius;
  /**
   * 描画する要素（既定 div）。
   * `PageTitle` / `SectionTitle` の内側のように、行ボックスに乗せたい場合は
   * `span` を指定して `inline-block` を className で足す。
   */
  readonly as?: "div" | "span";
  /**
   * 中身。行ボックスの高さを実物に合わせたい場合に `&nbsp;` を入れるなど、
   * 高さを内容から決めたいときだけ使う。通常は className で高さを指定する。
   */
  readonly children?: ReactNode;
}

/**
 * スケルトンのプレースホルダ矩形
 * スケルトンバー
 *
 * 読み込み中の矩形を「脈打たせる」表現・背景色・角丸をここに集約する。
 * サイズは場所ごとに違うため className で受け取り、共通部だけを足す。
 */
export function SkeletonBar({
  className,
  tone = 200,
  radius = "md",
  as: Tag = "div",
  children,
}: SkeletonBarProps) {
  return (
    <Tag
      className={`${className} animate-pulse ${TONE_CLASS[tone]} ${RADIUS_CLASS[radius]}`}
    >
      {children}
    </Tag>
  );
}
