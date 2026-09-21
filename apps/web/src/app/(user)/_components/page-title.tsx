import { isValidElement, type ReactNode } from "react";

import { PageTitleSkeleton } from "@/app/_components/page-title-skeleton";

/**
 * ページ見出しの見た目。`PageTitle`（本物）と `PageTitlePlaceholder`（読み込み中）で
 * 同じ箱にするために共有する。
 *
 * 見出しは白カードの外（斜線の地の上）に置かれる。foreground のスレート系だと
 * 緑がかった地から浮くため、地と同系の深緑（primary-900）を使う。
 *
 * 高さは行ボックス（1.4em 前後）ではなく HelpIconButton の直径（1.5em）で
 * 取る。`action` を持つページでも loading.tsx は `action` 無しでこの見出しを
 * 描くため、行の高さをボタンの有無で決めるとサーバー応答が届いた瞬間に
 * 見出しが 2px 下がる。
 */
const PAGE_TITLE_CLASSES =
  "min-h-[1.5em] text-xl md:text-2xl font-bold text-primary-900 text-center";

interface PageTitleProps {
  children: React.ReactNode;
  className?: string;
  /**
   * タイトルの右隣に並べる操作要素（ヘルプボタン等）。
   * 指定時はタイトルと1グループとして中央寄せする（blindfold-chess の PageLayout 準拠）。
   * `transform` を使う配置は子孫の `position: fixed`（モーダル等）の基準を壊すため避ける。
   */
  action?: React.ReactNode;
}

export function PageTitle({
  children,
  className = "",
  action,
}: PageTitleProps) {
  const heading = (
    <h1 aria-live="polite" className={`${PAGE_TITLE_CLASSES} ${className}`}>
      {children}
    </h1>
  );

  if (!action) return heading;

  return (
    // 文字サイズは包む側にも置く。操作要素（HelpIconButton）は em で大きさを
    // 決めるため、見出しと同じサイズを継承させて文字に揃える
    <div className="flex items-center justify-center gap-2 text-xl md:text-2xl">
      {heading}
      {action}
    </div>
  );
}

interface PageTitlePlaceholderProps {
  /** プレースホルダ帯の幅（Tailwind の `w-*` クラス） */
  readonly width?: string;
  readonly className?: string;
}

/**
 * 読み込み中のページ見出し
 * ページ見出しプレースホルダ
 *
 * `PageTitle` と同じ箱にグレー帯を置き、実描画に切り替わっても見出しの
 * 位置が動かないようにする（CLS 0）。スケルトンはこれを使い、`PageTitle` の
 * 子に `PageTitleSkeleton` を入れない — `PageTitle` は `<h1>` なので、
 * loading.tsx のスケルトンがそれを使うと「空の h1」が本物の h1 より先に
 * HTML へ出てしまう（Suspense 境界の fallback は初期 HTML に焼き込まれる）。
 * 見出しはページに 1 つだけ、本物だけが名乗る。
 */
export function PageTitlePlaceholder({
  width = "w-48",
  className = "",
}: PageTitlePlaceholderProps) {
  return (
    <div aria-hidden="true" className={`${PAGE_TITLE_CLASSES} ${className}`}>
      <PageTitleSkeleton width={width} />
    </div>
  );
}

/** ページ見出しの席に着ける要素（本物とプレースホルダ） */
const PAGE_TITLE_TYPES: readonly unknown[] = [PageTitle, PageTitlePlaceholder];

/**
 * 子要素がページ見出しの席に着くものか判定する。
 *
 * `ContentContainer` は見出しを白カードの外（タイトル帯）へ引き上げ、
 * そのときだけカードをフルブリードの縦伸びレイアウトに切り替える。判定を
 * `PageTitle` だけに絞ると、`PageTitlePlaceholder` を使う loading.tsx が
 * 見出しなしのレイアウトへ落ちる（カードが中身の幅まで縮む）。見出しの席に
 * 着けるものはここで一括して数え、両者を同じ扱いにする。
 */
export function isPageTitleElement(node: ReactNode): boolean {
  return isValidElement(node) && PAGE_TITLE_TYPES.includes(node.type);
}
