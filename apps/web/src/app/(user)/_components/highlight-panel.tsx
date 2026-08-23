import type { ReactNode } from "react";

/**
 * 目を引かせる囲み
 * 強調パネル
 *
 * 地の文から浮かせて読ませたいまとまりを入れる琥珀色の枠。教本のコラムや
 * 計算手順、設定由来の注意書きなど「本筋の隣に置く箱」がこれ一種類なので、
 * 枠・背景・余白の一式をここに集約する。中身は呼び出し側に任せる。
 */
export function HighlightPanel({ children }: { readonly children: ReactNode }) {
  return (
    <aside className="rounded-xl border-3 border-amber-500 bg-amber-50/60 p-5">
      {children}
    </aside>
  );
}
