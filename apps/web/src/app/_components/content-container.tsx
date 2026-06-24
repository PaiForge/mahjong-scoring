import { Children, isValidElement } from "react";

import { Breadcrumb, type BreadcrumbItem } from "./breadcrumb";
import { Divider } from "./divider";
import { PageTitle } from "./page-title";

interface ContentContainerProps {
  children: React.ReactNode;
  className?: string;
  /** パンくずリスト。指定するとカード下部に区切り線付きで表示する（チェスの PageLayout 準拠）。 */
  breadcrumb?: readonly BreadcrumbItem[];
  /**
   * 最上部要素に付与する id。`useScrollToElement` のスクロール先として使う。
   * 通常は PageTitle があればグレー帯、無ければ外側ラッパーに付与するが、
   * `fillViewport` 指定時は最小高さラッパーに付与する。
   */
  id?: string;
  /**
   * セッション全体を最小高さ画面いっぱい（min-h-screen）にする。
   * `useScrollToElement` と併用し、練習開始直後にグローバルヘッダを画面外へ送って
   * 練習コンテンツだけが表示されるようにする（blindfold-chess 準拠）。
   */
  fillViewport?: boolean;
}

/**
 * ページコンテンツの白カードラッパー（blindfold-chess の PagePanel / PageLayout 準拠）。
 *
 * 横幅は (user) レイアウトの `max-w-4xl` ラッパーが与えるため、ここでは持たない。
 * `-mx-4 sm:mx-0` でモバイル時は左右いっぱいに（フルブリード）、
 * sm 以上では角丸＋ボーダーのカードになる。
 *
 * レイアウトの main 背景はグレー（bg-secondary）で、この白カードがその上に浮く（blindfold-chess 準拠）。
 *
 * 子要素に `<PageTitle>` が含まれる場合は、それをカードの外（上）へ引き上げ、
 * 画面最上部の全幅領域に表示する（背景は main と同じグレーで連続する）。
 */
export function ContentContainer({ children, className = "", breadcrumb, id, fillViewport = false }: ContentContainerProps) {
  const childArray = Children.toArray(children);
  const title = childArray.find((child) => isValidElement(child) && child.type === PageTitle);
  const body = title
    ? childArray.filter((child) => !(isValidElement(child) && child.type === PageTitle))
    : childArray;

  const card = (
    <div
      className={`bg-card -mx-4 sm:mx-0 rounded-none sm:rounded-lg border-0 sm:border sm:border-border p-4 sm:p-6 md:p-8 ${className}`}
    >
      {body}
      {breadcrumb && breadcrumb.length > 0 && (
        <div className="mt-8 space-y-4">
          <Divider />
          <Breadcrumb items={breadcrumb} />
        </div>
      )}
    </div>
  );

  if (!title) {
    return (
      <div
        id={id}
        className={`mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8 ${fillViewport ? "min-h-screen" : ""}`}
      >
        {card}
      </div>
    );
  }

  // PageTitle 部分の全幅領域。main と同じグレー（bg-secondary）で、py-5 が
  // タイトル上下の余白を兼ねる（下側はそのままカードとの間隔になる）。
  const titleBand = (
    <div className="bg-secondary">
      <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 lg:px-8">{title}</div>
    </div>
  );
  // sm 以上で角丸カードがグレー背景から浮くよう、下側だけ余白を取る。
  // 上側はタイトル帯の py-5 が担うため、ここで pt を足すと二重になり開きすぎる。
  // モバイルはフルブリードのまま密着させる（角丸が出ないため余白不要）。
  const cardArea = (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 sm:pb-6">{card}</div>
  );

  // fillViewport 時はタイトル帯＋カードをまとめて min-h-screen ラッパーで包み、
  // スクロール先 id もそのラッパーに付与する（セッション全体が画面を埋める）。
  if (fillViewport) {
    return (
      <div id={id} className="min-h-screen">
        {titleBand}
        {cardArea}
      </div>
    );
  }

  return (
    <>
      <div id={id} className="bg-secondary">
        <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 lg:px-8">{title}</div>
      </div>
      {cardArea}
    </>
  );
}
