import { Children, isValidElement } from "react";

import { PageTitle } from "./page-title";

interface ContentContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * ページコンテンツの白カードラッパー（blindfold-chess の PagePanel / PageLayout 準拠）。
 *
 * 横幅は (user) レイアウトの `max-w-4xl` ラッパーが与えるため、ここでは持たない。
 * `-mx-4 sm:mx-0` でモバイル時は左右いっぱいに（フルブリード）、
 * sm 以上では角丸＋ボーダーのカードになる。
 *
 * 子要素に `<PageTitle>` が含まれる場合は、それをカードの外（上）へ引き上げ、
 * 画面最上部の全幅グレー帯として表示する。グレー地は PageTitle 部分のみに限定し、
 * カード本体・左右・下は白（レイアウトの白背景）にするため。
 */
export function ContentContainer({ children, className = "" }: ContentContainerProps) {
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
    </div>
  );

  if (!title) {
    return card;
  }

  return (
    <>
      {/* PageTitle 部分のみ全幅のグレー帯。`-mt-4` でレイアウトの上パディングを打ち消し、
          `left-1/2 w-screen -translate-x-1/2` でビューポート全幅にブリードさせる。
          `mb-3` でカードとの間隔を与える（カードを直接描画し、余計なラッパーは挟まない）。 */}
      <div className="relative left-1/2 -mt-4 mb-3 w-screen -translate-x-1/2 bg-secondary">
        <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 lg:px-8">{title}</div>
      </div>
      {card}
    </>
  );
}
