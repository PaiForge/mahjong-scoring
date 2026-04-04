import {
  HaiKind,
  parseMspz,
  parseExtendedMspz,
  type HaiKindId,
  type Kazehai,
  type Tehai14,
} from "@pai-forge/riichi-mahjong";

/**
 * 牌種IDをMSPZ文字列に変換する
 * 牌ID→MSPZ変換
 */
export function haiIdToMspz(id: HaiKindId): string {
  if (id >= 0 && id <= 8) return `${id + 1}m`;
  if (id >= 9 && id <= 17) return `${id - 9 + 1}p`;
  if (id >= 18 && id <= 26) return `${id - 18 + 1}s`;
  if (id >= 27 && id <= 33) return `${id - 27 + 1}z`;
  return "1m";
}

/**
 * 風牌IDをMSPZ文字列に変換する
 * 風牌ID→MSPZ変換
 */
export function kazeIdToMspz(id: Kazehai): string {
  if (id === HaiKind.Ton) return "1z";
  if (id === HaiKind.Nan) return "2z";
  if (id === HaiKind.Sha) return "3z";
  if (id === HaiKind.Pei) return "4z";
  return "1z";
}

/**
 * 牌IDリストを花色ごとのバケットに振り分ける
 * 花色バケット振り分け
 */
function bucketSortHais(ids: readonly HaiKindId[]): {
  readonly mans: number[];
  readonly pins: number[];
  readonly sous: number[];
  readonly zis: number[];
} {
  const mans: number[] = [];
  const pins: number[] = [];
  const sous: number[] = [];
  const zis: number[] = [];

  for (const id of ids) {
    if (id >= 0 && id <= 8) mans.push(id + 1);
    else if (id >= 9 && id <= 17) pins.push(id - 9 + 1);
    else if (id >= 18 && id <= 26) sous.push(id - 18 + 1);
    else if (id >= 27 && id <= 33) zis.push(id - 27 + 1);
  }

  mans.sort((a, b) => a - b);
  pins.sort((a, b) => a - b);
  sous.sort((a, b) => a - b);
  zis.sort((a, b) => a - b);

  return { mans, pins, sous, zis };
}

/**
 * バケットをMSPZ文字列に変換する
 * バケット→MSPZ変換
 */
function bucketsToMspz(buckets: {
  readonly mans: readonly number[];
  readonly pins: readonly number[];
  readonly sous: readonly number[];
  readonly zis: readonly number[];
}): string {
  let result = "";
  if (buckets.mans.length) result += buckets.mans.join("") + "m";
  if (buckets.pins.length) result += buckets.pins.join("") + "p";
  if (buckets.sous.length) result += buckets.sous.join("") + "s";
  if (buckets.zis.length) result += buckets.zis.join("") + "z";
  return result;
}

/**
 * 手牌をMSPZ文字列に変換する
 * 手牌→MSPZ変換
 */
export function tehaiToMspz(tehai: Tehai14): string {
  let result = bucketsToMspz(bucketSortHais(tehai.closed));

  for (const meld of tehai.exposed) {
    const meldStr = bucketsToMspz(bucketSortHais(meld.hais));

    if (meld.type === "Kantsu" && !meld.furo) {
      // 暗槓: (...) 表記
      result += `(${meldStr})`;
    } else {
      // 副露（チー・ポン・大明槓）: [...] 表記
      result += `[${meldStr}]`;
    }
  }

  return result;
}

/**
 * 牌文字列（MSPZ）をIDリストに変換する
 * MSPZ→牌IDリスト変換
 */
export function parseHais(str: string | undefined): HaiKindId[] {
  if (!str) return [];
  const result = parseMspz(str);
  if (result.isOk()) return [...result.value.closed];

  const extResult = parseExtendedMspz(str);
  if (extResult.isOk()) return [...extResult.value.closed];

  return [];
}

/**
 * 風牌文字列をIDに変換する
 * 風牌文字列→ID変換
 */
export function parseKazehai(str: string | undefined): Kazehai | undefined {
  if (!str) return undefined;
  const result = parseMspz(str);
  if (result.isErr()) return undefined;

  const id = result.value.closed[0];
  if (id === HaiKind.Ton || id === HaiKind.Nan || id === HaiKind.Sha || id === HaiKind.Pei) {
    return id;
  }
  return undefined;
}
