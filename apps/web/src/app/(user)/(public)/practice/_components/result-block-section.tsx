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
 *
 * 高さの根拠（2026-09 に puppeteer で実測）:
 * - 登録 CTA（未ログイン）: 幅 390px で 240px（縦積みが最大）、sm 以上では
 *   横並びになり 220px 未満
 * - 記録セクション（EXP + 比較、バッジなし）: 約 175px
 * - 同・レベルアップ + 自己ベスト更新の両バッジ付き: 約 260px。この稀な
 *   最大変種まで包含すると通常変種の余白が大きくなりすぎるため許容し、
 *   よく出る変種（上 2 つ）を包含する 240px / 220px を採る
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
      className="min-h-[240px] sm:min-h-[220px] space-y-3"
    >
      {props.children}
    </section>
  );
}
