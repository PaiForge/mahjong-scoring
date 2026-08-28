import {
  FuroType,
  MentsuType,
  Tacha,
  haisToMspz,
  parseHais,
} from "@mahjong-scoring/core";
import type { CompletedMentsu, Furo, HaiKindId } from "@mahjong-scoring/core";

import { hasFieldTypes, isRecord } from "./shape-guards";

/**
 * 面子の保存形
 * 面子保存形
 *
 * 結果ページで面子を出題時と同じ体裁（副露・槓子は横倒しで晒す）に描き直す
 * ための最小限。sessionStorage を経由する都合上、ブランド型の牌はそのまま
 * 往復できないため MSPZ 文字列に落とす。
 */
export interface SerializedMentsu {
  /** 面子の牌（MSPZ） */
  readonly tiles: string;
  readonly type: MentsuType;
  /** 副露の種別と出所。鳴いていない面子では持たない */
  readonly furo?: Furo;
}

/** 完成面子を保存形に変換する */
export function toSerializedMentsu(mentsu: CompletedMentsu): SerializedMentsu {
  return {
    tiles: haisToMspz(mentsu.hais),
    type: mentsu.type,
    ...(mentsu.furo ? { furo: mentsu.furo } : {}),
  };
}

/**
 * 保存形から完成面子を組み立て直す
 * 面子復元
 *
 * 枚数が種別と合わない（保存形式が壊れている）ときは undefined を返し、
 * 呼び出し側は面子としての表示を諦める。
 */
export function restoreMentsu(
  value: SerializedMentsu,
): CompletedMentsu | undefined {
  return buildMentsu(value.type, parseHais(value.tiles), value.furo);
}

/**
 * 牌と種別から完成面子を組み立てる
 * 面子組み立て
 *
 * 牌を保存形とは別に持っている呼び出し側（回答行ごとに牌を持つ練習）向け。
 */
export function buildMentsu(
  type: MentsuType,
  tiles: readonly HaiKindId[],
  furo: Furo | undefined,
): CompletedMentsu | undefined {
  if (type === MentsuType.Kantsu) {
    const [a, b, c, d] = tiles;
    if (d === undefined) return undefined;
    return { type, hais: [a, b, c, d], furo };
  }
  if (type === MentsuType.Shuntsu || type === MentsuType.Koutsu) {
    const [a, b, c] = tiles;
    if (c === undefined) return undefined;
    return { type, hais: [a, b, c], furo };
  }
  return undefined;
}

/**
 * 完成面子の種別。未完成面子（対子・塔子）は和了形の一部として出題されない
 */
const COMPLETED_MENTSU_TYPES: readonly unknown[] = [
  MentsuType.Shuntsu,
  MentsuType.Koutsu,
  MentsuType.Kantsu,
];

/** 値が完成面子の種別として妥当か検証する */
export function isCompletedMentsuType(value: unknown): value is MentsuType {
  return COMPLETED_MENTSU_TYPES.includes(value);
}

/** 値が Furo として妥当か検証する */
export function isValidFuro(value: unknown): value is Furo {
  if (!isRecord(value)) return false;
  return (
    Object.values<unknown>(FuroType).includes(Reflect.get(value, "type")) &&
    Object.values<unknown>(Tacha).includes(Reflect.get(value, "from"))
  );
}

/**
 * 任意フィールドの furo が妥当か検証する
 * 副露フィールド検証
 *
 * 鳴いていない面子は furo を持たないため、無い場合も妥当とする。
 */
export function hasValidOptionalFuro(value: unknown): boolean {
  const furo: unknown = isRecord(value)
    ? Reflect.get(value, "furo")
    : undefined;
  return furo === undefined || isValidFuro(furo);
}

/** 値が SerializedMentsu として妥当か検証する */
export function isValidSerializedMentsu(
  value: unknown,
): value is SerializedMentsu {
  if (!hasFieldTypes(value, { tiles: "string" })) return false;
  return (
    isCompletedMentsuType(Reflect.get(value, "type")) &&
    hasValidOptionalFuro(value)
  );
}
