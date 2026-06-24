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
   * 白カード自身を最小高さ画面いっぱい（min-h-screen）にして画面を埋め、スクロール先 id
   * はカード領域（本文）に付与する。`useScrollToElement` やハッシュ遷移と併用すると、
   * 練習開始直後にタイトル帯・グローバルヘッダが画面外へ送られ、本文（盤面）が最上部に
   * 来る。白背景が伸びるため main の bg-secondary はタイトル帯周辺にしか露出しない
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
 * レイアウトの main 背景は bg-secondary（slate-50 / #f8fafc）で、この白カードがその上に薄く浮く（blindfold-chess 準拠）。
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

  // fillViewport 時は白カード自身を min-h-screen にして画面を埋める。
  // ラッパー（透明）側に付けると下に main の bg-secondary が伸びてしまうため、
  // 白背景が伸びるようカードへ付与する（blindfold-chess のセッション画面準拠）。
  // 通常時はモバイル（<sm）で flex-1 にし、cardArea（flex-col）内で縦に伸ばす。
  // これで本文が短くてもカード下に main の bg-secondary が露出せず、グレーはタイトル帯
  // 周辺だけになる（sm 以上は flex-none に戻し、角丸カードがグレー背景から浮く従来表示）。
  const card = (
    <div
      className={`bg-card -mx-4 sm:mx-0 rounded-none sm:rounded-lg border-0 sm:border sm:border-border p-4 sm:p-6 md:p-8${fillViewport ? " min-h-screen" : " flex-1 sm:flex-none"} ${className}`}
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
      <div id={id} className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        {card}
      </div>
    );
  }

  // PageTitle 部分。背景はレイアウトの main（bg-secondary）が透けて見えるため、
  // ここで bg-secondary を再指定しない（背景色は main に一元化する）。
  // py-5 がタイトル上下の余白を兼ねる（下側はそのままカードとの間隔になる）。
  // fillViewport 時はスクロール先をカード領域に置くため、タイトル帯には id を付けない
  // （タイトルはスクロールで画面外へ送られ、本文＝カードが最上部に来る）。
  const titleBand = (
    <div
      id={fillViewport ? undefined : id}
      className="mx-auto max-w-4xl px-4 py-5 sm:px-6 lg:px-8"
    >
      {title}
    </div>
  );
  // sm 以上で角丸カードがグレー背景から浮くよう、下側だけ余白を取る（sm:pb-6）。
  // 上側はタイトル帯の py-5 が担うため、ここで pt を足すと二重になり開きすぎる。
  // モバイル（<sm）は flex-col + flex-1 で画面下端まで縦に伸ばし、白カードに高さを与える
  // （これでカード下に bg-secondary が露出しない）。フルブリードのまま密着させる。
  // fillViewport 時はこのカード領域をスクロール先 id にする（min-h-screen は白カード側）。
  // これによりタイトル帯・グローバルヘッダはスクロールで画面外へ送られ、本文が最上部に来る。
  const cardArea = (
    <div
      id={fillViewport ? id : undefined}
      className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 sm:block sm:flex-none sm:px-6 sm:pb-6 lg:px-8"
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
