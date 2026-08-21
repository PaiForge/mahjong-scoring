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

/** スケルトンの濃さ。数字が大きいほど濃い */
export type SkeletonTone = keyof typeof TONE_CLASS;

interface SkeletonBarProps {
  /** この矩形固有のクラス（高さ・幅・角丸・余白など） */
  readonly className: string;
  /** 濃さ（既定 200） */
  readonly tone?: SkeletonTone;
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
 * 読み込み中の矩形を「脈打たせる」表現と背景色をここに集約する。サイズや
 * 角丸は場所ごとに違うため className で受け取り、共通部だけを足す。
 */
export function SkeletonBar({
  className,
  tone = 200,
  as: Tag = "div",
  children,
}: SkeletonBarProps) {
  return (
    <Tag className={`${className} animate-pulse ${TONE_CLASS[tone]}`}>
      {children}
    </Tag>
  );
}
