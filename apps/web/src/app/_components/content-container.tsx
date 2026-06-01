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
 * 子要素に `<PageTitle>` が含まれる場合は、それをカードの外（上）へ引き上げて
 * グレー地に中央寄せで表示する。チェスの「タイトルはパネルの上」レイアウトに揃えるため。
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
    <div className="space-y-4">
      {title}
      {card}
    </div>
  );
}
