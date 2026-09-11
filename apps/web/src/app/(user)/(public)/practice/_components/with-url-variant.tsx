"use client";

import { Suspense, type ReactNode } from "react";
import type {
  PracticeMenuSlug,
  PracticeVariantOf,
} from "@/lib/db/practice-menu-types";
import { useVariantQuery } from "../_hooks/use-variant-query";

interface WithUrlVariantProps<S extends PracticeMenuSlug> {
  readonly slug: S;
  /**
   * 今の URL のバリアントで描く。URL を読み出す前（プリレンダー HTML と
   * hydrate 直後）は undefined で呼ばれる
   */
  readonly children: (variant: PracticeVariantOf<S> | undefined) => ReactNode;
}

function Resolved<S extends PracticeMenuSlug>({
  slug,
  children,
}: WithUrlVariantProps<S>) {
  return <>{children(useVariantQuery(slug))}</>;
}

/**
 * 今の URL の出題設定（バリアント）で描く境界
 * URL バリアント境界
 *
 * トレーニング画面の「終了する」「チャレンジに挑戦」のように、遷移先へ今の
 * 出題設定を引き継ぐリンクが使う。説明ページの選択パネルは URL の
 * `?variant=` を初期選択にし、play / training の盤面も同じ値で出題するため、
 * ここで落とすと戻った先で設定が既定に戻り、切り替えた先で既定の土俵に
 * 着地してしまう。
 *
 * `useSearchParams()` は静的ルートでそのサブツリーをクライアント描画に
 * するため、Suspense はここで閉じる。フォールバックは undefined で描いた
 * もの — パス関数（`practiceHref` / `practicePlayHref`）は未指定を既定として
 * 扱うので、プリレンダー HTML のリンクも壊れてはおらず、hydrate 後に URL の
 * 値で差し替わるだけ。
 */
export function WithUrlVariant<S extends PracticeMenuSlug>({
  slug,
  children,
}: WithUrlVariantProps<S>) {
  return (
    <Suspense fallback={children(undefined)}>
      <Resolved slug={slug}>{children}</Resolved>
    </Suspense>
  );
}
