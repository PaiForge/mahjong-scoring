import {
  HaiKind,
  parseMspz,
  parseExtendedMspz,
  type HaiKindId,
  type Kazehai,
  type Tehai,
  type Tehai14,
} from "@pai-forge/riichi-mahjong";

/** MSPZ の花色サフィックス */
type Suit = "m" | "p" | "s" | "z";

/** 花色の表記順（MSPZ 標準順） */
const SUITS: readonly Suit[] = ["m", "p", "s", "z"];

/**
 * 牌種IDを花色と数字に分解する
 * 牌ID→花色数字分解
 */
function haiIdToSuitNumber(id: HaiKindId): {
  readonly suit: Suit;
  readonly number: number;
} {
  if (id >= 27) return { suit: "z", number: id - 27 + 1 };
  if (id >= 18) return { suit: "s", number: id - 18 + 1 };
  if (id >= 9) return { suit: "p", number: id - 9 + 1 };
  return { suit: "m", number: id + 1 };
}

/**
 * 牌種IDをMSPZ文字列に変換する
 * 牌ID→MSPZ変換
 */
export function haiIdToMspz(id: HaiKindId): string {
  const { suit, number } = haiIdToSuitNumber(id);
  return `${number}${suit}`;
}

/** 風牌ID→MSPZ文字列マップ */
const KAZE_TO_MSPZ: Readonly<Record<Kazehai, string>> = {
  [HaiKind.Ton]: "1z",
  [HaiKind.Nan]: "2z",
  [HaiKind.Sha]: "3z",
  [HaiKind.Pei]: "4z",
};

/**
 * 風牌IDをMSPZ文字列に変換する
 * 風牌ID→MSPZ変換
 */
export function kazeIdToMspz(id: Kazehai): string {
  return KAZE_TO_MSPZ[id] ?? "1z";
}

/**
 * 牌IDリストを花色ごとのバケットに振り分ける
 * 花色バケット振り分け
 */
function bucketSortHais(
  ids: readonly HaiKindId[],
): Readonly<Record<Suit, readonly number[]>> {
  const buckets: Record<Suit, number[]> = { m: [], p: [], s: [], z: [] };

  for (const id of ids) {
    const { suit, number } = haiIdToSuitNumber(id);
    buckets[suit].push(number);
  }

  for (const suit of SUITS) {
    buckets[suit].sort((a, b) => a - b);
  }

  return buckets;
}

/**
 * バケットをMSPZ文字列に変換する
 * バケット→MSPZ変換
 */
function bucketsToMspz(
  buckets: Readonly<Record<Suit, readonly number[]>>,
): string {
  let result = "";
  for (const suit of SUITS) {
    if (buckets[suit].length) result += buckets[suit].join("") + suit;
  }
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
 * MSPZ / Extended MSPZ 文字列を柔軟にパースする（Extended 優先）
 * 柔軟MSPZ解析
 */
function parseFlexible(str: string): Tehai | undefined {
  const ext = parseExtendedMspz(str);
  if (ext.isOk()) return ext.value;
  const std = parseMspz(str);
  if (std.isOk()) return std.value;
  return undefined;
}

/**
 * 牌文字列（MSPZ / Extended MSPZ）を手牌オブジェクトに変換する
 * MSPZ→手牌変換
 *
 * 副露（`[...]`）・暗槓（`(...)`）を含む Extended MSPZ にも対応し、
 * closed / exposed を保持した Tehai を返す。パースできない場合は undefined。
 */
export function parseTehai(str: string | undefined): Tehai | undefined {
  if (!str) return undefined;
  return parseFlexible(str);
}

/**
 * 牌文字列（MSPZ / Extended MSPZ）の純手牌部分をIDリストに変換する
 * MSPZ→牌IDリスト変換
 */
export function parseHais(str: string | undefined): HaiKindId[] {
  if (!str) return [];
  return [...(parseFlexible(str)?.closed ?? [])];
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
