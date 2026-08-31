import { parseHais, parseKazehai, parseTehai } from "@mahjong-scoring/core";
import type { HaiKindId, Kazehai, Tehai } from "@mahjong-scoring/core";

/**
 * 結果に保存された牌まわりの MSPZ 文字列
 * 出題牌スナップショット
 *
 * sessionStorage を経由する都合上、ブランド型（`Tehai` 等）はそのまま往復
 * できないため、牌はすべて MSPZ 文字列で保存されている。この 4 つは点数系・
 * 符系・役系のどの練習でも同じ名前で保存する共通の最小単位。
 */
export interface QuestionTilesSnapshot {
  /** 手牌（Extended MSPZ。和了牌を含む14枚 + 副露・暗槓） */
  readonly tehai: string;
  /** 和了牌（MSPZ） */
  readonly agariHai: string;
  /** 場風（MSPZ） */
  readonly bakaze: string;
  /** 自風（MSPZ） */
  readonly jikaze: string;
}

/** {@link parseQuestionTiles} が復元した牌 */
export interface QuestionTiles {
  readonly tehai: Tehai;
  readonly agariHai: HaiKindId;
  readonly bakaze: Kazehai;
  readonly jikaze: Kazehai;
}

/**
 * 保存された MSPZ 文字列から手牌・和了牌・場風・自風を復元する
 * 出題牌復元
 *
 * どれか 1 つでもパースに失敗したら undefined を返す。呼び出し側は手牌の
 * 再表示だけを諦めればよく、正誤や回答の比較は牌の復元に依存しないため
 * そのまま表示できる。スナップショットを保存する前の旧データも同様に
 * undefined になる。
 *
 * 部分的に復元した結果を返さないのは、4 つが揃って初めて「その局面」を
 * 描けるため（和了牌が欠けた手牌は牌姿として意味を成さない）。
 */
export function parseQuestionTiles(
  snapshot: QuestionTilesSnapshot,
): QuestionTiles | undefined {
  const tehai = parseTehai(snapshot.tehai);
  const agariHai = parseHais(snapshot.agariHai)[0];
  const bakaze = parseKazehai(snapshot.bakaze);
  const jikaze = parseKazehai(snapshot.jikaze);
  if (!tehai || agariHai === undefined || !bakaze || !jikaze) return undefined;
  return { tehai, agariHai, bakaze, jikaze };
}

/**
 * MSPZ 文字列のドラ表示牌リストを牌IDに復元する
 * ドラ表示牌復元
 *
 * 表示牌は 1 文字ずつ別の要素で保存されるとは限らないため、要素ごとに
 * `parseHais` を通して平坦化する。
 */
export function parseMarkers(
  markers: readonly string[] | undefined,
): readonly HaiKindId[] | undefined {
  return markers?.flatMap((marker) => parseHais(marker));
}
