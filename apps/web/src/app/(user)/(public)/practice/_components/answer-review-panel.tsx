import type { ReactNode } from "react";

/**
 * トレーニングの答え合わせの資料をまとめる面
 * 答え合わせ資料の面
 *
 * トレーニング・模試で止まっている間、盤面の末尾に出す「面子分解」の行と
 * 「内訳を確認」の入口を 1 枚の白い面（淡い枠）に入れる。直下には全幅の
 * 「次の問題へ」が続く。押せる行が面無しで並ぶと、行とボタンの境目は余白
 * だけになり、「内訳を確認」の文字を狙って下に落ちた指をボタンが受けて
 * 問題が進む（取り消せず、見ようとした内訳ごと手牌が消える。模試で実際に
 * 起きた）。枠の線が「ここまでが読む資料、ここからが進む操作」の境目を見せ、
 * 行の当たり判定（44px）の下端も線で分かる。シェル側はこの面とボタンの
 * 間隔を一段広く取る（{@link import("./training-shell").TrainingShell}）。
 *
 * 点数系の答え合わせの表（`ResultTableFrame`）が表と内訳を同じ面にまとめて
 * いるのと同じ姿。選択肢の正誤がそのまま答え合わせになる練習（合計符・
 * 翻数即答）には表が無いので、資料だけをこの面に入れる。中に置く内訳は
 * `surface="sunken"` で沈める（白い枠を入れ子にしない。`BreakdownPanel` 参照）。
 *
 * 行の間は罫線（`divide-y`）で区切る。面子分解を描かない手（七対子・
 * 国士無双等）では行が 1 つになり、罫線も出ない。上下の余白は行の
 * 当たり判定（44px）に 4px を足すだけにして、閉じている間の丈を抑える。
 */
export function AnswerReviewPanel({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <div className="divide-y divide-surface-200 rounded-panel border border-panel bg-white px-3 py-1">
      {children}
    </div>
  );
}
