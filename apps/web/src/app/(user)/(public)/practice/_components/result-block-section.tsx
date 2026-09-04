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
 * 高さの根拠:
 * - 登録 CTA（未ログイン）: 幅 390px で 248px（縦積みが最大）、sm 以上では
 *   横並びになり 220px 未満（2026-09 に puppeteer で実測）
 * - 記録セクション: 見出し行・スコア 3 行・導線 1 行の固定の形で、初回の記録
 *   でも自己ベスト更新でも行数が変わらない（バッジは見出し行の中に出る）。
 *   実測時の 2 行版 175px にスコア 1 行（約 28px）を足した約 203px、EXP の
 *   レベルアップ表示が出る回でも約 245px で、いずれも 248px に収まる
 *
 * したがって最小高さを決めているのは登録 CTA の方であり、記録セクションの
 * 分岐は高さに影響しない。CTA 側のレイアウトを変えたときだけ測り直せばよい。
 *
 * CTA の高さは中のボタンと補助リンクの間隔（`SUB_LINK_GAP`）に連動する。
 * あの余白を変えたらここも測り直すこと。
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
      className="min-h-[248px] sm:min-h-[220px] space-y-3"
    >
      {props.children}
    </section>
  );
}
