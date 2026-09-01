import type { ReactNode } from "react";

/**
 * 結果ブロックの共通外殻
 * 結果ブロック枠
 *
 * `AsyncResultBlock` が描画する全分岐（未ログインの登録 CTA / ログイン済みの
 * 記録セクション）と、その Suspense fallback（`ResultBlockSkeleton`）が
 * 共有するシルエット。「SectionTitle + 本文」を同じ最小高さの `<section>` に
 * 収めることで、fallback からどの分岐へ置き換わってもレイアウトが動かず、
 * CLS を構造的に 0 に保つ。
 *
 * min-h はここに一元化する。各分岐やスケルトンが個別の `min-h-*` を持つと、
 * 分岐追加のたびに「全部の最大高さを実測して揃え直す」作業が発生するため。
 */
interface ResultBlockSectionProps {
  readonly children: ReactNode;
  /** スケルトンを支援技術から隠すためのフラグ（実分岐では渡さない） */
  readonly "aria-hidden"?: boolean;
  /** テストからスケルトンを特定するための testid（実分岐では渡さない） */
  readonly "data-testid"?: string;
}

export function ResultBlockSection(props: ResultBlockSectionProps) {
  return (
    <section
      aria-hidden={props["aria-hidden"]}
      data-testid={props["data-testid"]}
      className="min-h-[220px] space-y-3"
    >
      {props.children}
    </section>
  );
}
