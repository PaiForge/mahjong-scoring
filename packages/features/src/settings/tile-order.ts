/**
 * 手牌の並べ方
 * 牌の並び順モード
 *
 * 練習の盤面で純手牌を理牌したまま出すか、ランダムな順に並べ直して出すか。
 * 出題・正解判定・採点には関わらない見え方の設定。
 *
 * - `sorted` — 理牌したまま（既定。従来の表示）
 * - `unsorted` — 理牌済みの純手牌をランダムに並べ直す（Pro の `practice_tools` 特典）
 *
 * `unsorted` は「配られた順を再現する」ものではない。問題は理牌済みの手牌しか
 * 持たず、配牌の順を出すには別のデータ（配った順の記録）が要る。ここで作れるのは
 * 理牌済みの並びの置換だけなので、意味もそれに限る。並べ直すのは純手牌だけで、
 * 副露は鳴いた順のまま、和了牌は混ぜずに右へ分けて置く（どの牌で和了したかは
 * 待ちの符・ツモの符を決める出題の条件で、混ぜると出題が変わるため）。
 *
 * 「色ごとにまとめて色の中だけ崩す」等の部分的な崩しは段階として持たない
 * （設定の選択肢を増やすほどの需要が見えていない）。
 */
export type TileOrderMode = "sorted" | "unsorted";

/** 従来の表示を既定にする */
export const DEFAULT_TILE_ORDER: TileOrderMode = "sorted";

/**
 * 永続値を手牌の並べ方に正規化する
 * 牌の並び順正規化
 *
 * 保存値は端末のストレージから来るため、欠損・未知の値・型違いがありうる。
 * どれも既定（`sorted`）に倒す。
 *
 * @param value 永続化されていた値
 */
export function normalizeTileOrder(value: unknown): TileOrderMode {
  return value === "unsorted" ? "unsorted" : DEFAULT_TILE_ORDER;
}
