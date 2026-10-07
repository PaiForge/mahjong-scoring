import {
  HaiKind,
  formatMpsz,
  parseExtendedMpsz,
  parseMpsz,
  tehaiToHaiKindId,
  type HaiKindId,
  type Kazehai,
  type Tehai,
} from "@pai-forge/riichi-mahjong";

/**
 * 牌種IDをMPSZ文字列に変換する
 * 牌ID→MPSZ変換
 */
export function haiIdToMpsz(id: HaiKindId): string {
  return haisToMpsz([id]);
}

/**
 * 牌IDリストをMPSZ文字列に変換する
 * 牌IDリスト→MPSZ変換
 *
 * {@link parseHais} の逆変換。面子や雀頭のように手牌の一部だけを保存して
 * 読み戻す用途で使う。純手牌だけの手牌として `formatMpsz` の正規形に
 * 書き出すため、牌は花色ごとに昇順へ並べ直され、元の並び順は保たれない。
 */
export function haisToMpsz(hais: readonly HaiKindId[]): string {
  return formatMpsz({ closed: hais, exposed: [] });
}

/**
 * 牌文字列（Extended MPSZ）を手牌オブジェクトに変換する
 * MPSZ→手牌変換
 *
 * 面子ブロック（副露 `[...]`・加槓 `{...}`・暗槓 `(...)`）を含む文字列も
 * 含まない文字列も受け付け、closed / exposed を保持した Tehai を返す。
 * パースできない場合は undefined。
 *
 * 戻り値は牌種 ID の手牌で、赤 5（`0m` 等）は 5 として読む。解釈した
 * 手牌はどれも点数計算か牌の描画に渡され、どちらも牌種 ID しか受け付け
 * ない（赤ドラは点数に乗らず、赤 5 の牌画像も持たない）ため。
 *
 * 1.x の表記（方向注釈の無い副露 `[123m]` など）は受け付けない。
 * 保存済みの旧表記はここで undefined になり、呼び出し側は表示を諦める。
 */
export function parseTehai(str: string | undefined): Tehai | undefined {
  if (!str) return undefined;
  const result = parseExtendedMpsz(str);
  return result.isOk() ? tehaiToHaiKindId(result.value) : undefined;
}

/**
 * 牌文字列（Extended MPSZ）の純手牌部分をIDリストに変換する
 * MPSZ→牌IDリスト変換
 *
 * 純手牌は表記の順のまま返す（整列しない）。読めない文字列は空配列。
 */
export function parseHais(str: string | undefined): HaiKindId[] {
  return [...(parseTehai(str)?.closed ?? [])];
}

/**
 * 風牌文字列をIDに変換する
 * 風牌文字列→ID変換
 */
export function parseKazehai(str: string | undefined): Kazehai | undefined {
  if (!str) return undefined;
  const result = parseMpsz(str);
  if (result.isErr()) return undefined;

  const id = result.value.closed[0];
  if (
    id === HaiKind.Ton ||
    id === HaiKind.Nan ||
    id === HaiKind.Sha ||
    id === HaiKind.Pei
  ) {
    return id;
  }
  return undefined;
}
