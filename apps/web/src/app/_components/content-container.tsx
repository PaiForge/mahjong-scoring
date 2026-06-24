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
   * `fillViewport` 指定時はカード領域（本文）に付与する。
   */
  id?: string;
  /**
   * カード領域（本文）を最小高さ画面いっぱい（min-h-screen）にし、スクロール先 id も
   * そこへ付与する。`useScrollToElement` やハッシュ遷移と併用すると、練習開始直後に
   * タイトル帯・グローバルヘッダが画面外へ送られ、本文（盤面）が最上部に来る
   * （blindfold-chess のセッション画面準拠：タイトルはスクロール対象に含めない）。
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
  // fillViewport 時はスクロール先をカード領域に置くため、タイトル帯には id を付けない
  // （タイトルはスクロールで画面外へ送られ、本文＝カードが最上部に来る）。
  const titleBand = (
    <div id={fillViewport ? undefined : id} className="bg-secondary">
      <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 lg:px-8">{title}</div>
    </div>
  );
  // sm 以上で角丸カードがグレー背景から浮くよう、下側だけ余白を取る。
  // 上側はタイトル帯の py-5 が担うため、ここで pt を足すと二重になり開きすぎる。
  // モバイルはフルブリードのまま密着させる（角丸が出ないため余白不要）。
  // fillViewport 時はこのカード領域をスクロール先 id にし、min-h-screen で画面を埋める。
  // これによりタイトル帯・グローバルヘッダはスクロールで画面外へ送られ、本文が最上部に来る。
  const cardArea = (
    <div
      id={fillViewport ? id : undefined}
      className={`mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 sm:pb-6${fillViewport ? " min-h-screen" : ""}`}
    >
      {card}
    </div>
  );

  return (
    <>
      {titleBand}
      {cardArea}
    </>
  );
}
