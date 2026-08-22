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
   * 来る。白背景が伸びるため地の斜線はタイトル帯周辺にしか露出しない
   * （blindfold-chess のセッション画面準拠：タイトルはスクロール対象に含めない）。
   */
  fillViewport?: boolean;
}

/**
 * ページコンテンツの白カードラッパー（blindfold-chess の PagePanel / PageLayout 準拠）。
 *
 * 横幅は (user) レイアウトの `max-w-4xl` ラッパーが与えるため、ここでは持たない。
 * `-mx-4 sm:mx-0` でモバイル時は左右いっぱいに（フルブリード。上下だけ太枠を残す）、
 * sm 以上では大きな角丸＋四辺の太枠＋オフセット影のカードになる。
 *
 * 地は body の下地（bg-secondary + 薄い斜線）で、この白カードがその上に浮く。
 * (user) レイアウトの main は背景を持たないため、地の柄はページ全体で連続する。
 *
 * 子要素に `<PageTitle>` が含まれる場合は、それをカードの外（上）へ引き上げ、
 * 画面最上部の全幅領域に表示する（背景は地の斜線がそのまま続く）。
 */
export function ContentContainer({
  children,
  className = "",
  breadcrumb,
  id,
  fillViewport = false,
}: ContentContainerProps) {
  const childArray = Children.toArray(children);
  const title = childArray.find(
    (child) => isValidElement(child) && child.type === PageTitle,
  );
  const body = title
    ? childArray.filter(
        (child) => !(isValidElement(child) && child.type === PageTitle),
      )
    : childArray;

  // fillViewport 時は白カード自身を min-h-screen にして画面を埋める。
  // ラッパー（透明）側に付けると下に地の斜線が伸びてしまうため、
  // 白背景が伸びるようカードへ付与する（blindfold-chess のセッション画面準拠）。
  // 通常時はモバイル（<sm）で flex-1 にし、cardArea（flex-col）内で縦に伸ばす。
  // これで本文が短くてもカード下に地の斜線が露出せず、地はタイトル帯周辺だけになる
  // （sm 以上は flex-none に戻し、角丸カードが地から浮く従来表示）。
  //
  // タイトル帯があるレイアウトでは、モバイルのカードが flex-1 で画面下端まで伸びて
  // フッターに密着する。カード下端の枠線（4px）とフッター上端の枠線（4px）が並ぶと
  // 8px の太い線に見えるため、この場合はカードの下枠を落としてフッターの枠線に任せる。
  // タイトル無しのレイアウトはラッパーの py-6 でフッターとの間に余白があるため、
  // 従来どおり四辺（モバイルは上下）に枠を持たせる。
  const card = (
    <div
      className={`bg-card -mx-4 sm:mx-0 rounded-none sm:rounded-2xl ${title ? "border-t-4" : "border-y-4"} border-ink sm:border-4 sm:shadow-lg p-4 sm:p-6 md:p-8${fillViewport ? " min-h-screen" : " flex-1 sm:flex-none"} ${className}`}
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

  // PageTitle 部分。背景は body の下地がそのまま透けて見えるため、
  // ここで背景を指定しない（地の指定は body に一元化する）。
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
  // sm 以上で角丸カードが地から浮くよう、下側だけ余白を取る（sm:pb-6）。
  // 上側はタイトル帯の py-5 が担うため、ここで pt を足すと二重になり開きすぎる。
  // モバイル（<sm）は flex-col + flex-1 で画面下端まで縦に伸ばし、白カードに高さを与える
  // （これでカード下に地が露出しない）。フルブリードのまま密着させる。
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
