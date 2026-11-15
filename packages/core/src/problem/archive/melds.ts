import {
  FuroType,
  MentsuType,
  Tacha,
  isSuupai,
  kindIdToHaiType,
  type CompletedMentsu,
  type HaiKindId,
} from "@pai-forge/riichi-mahjong";
import { isHaiKindId } from "../../core/type-guards";
import type { ArchivedFrom, ArchivedMeld } from "./types";

/**
 * 鳴き元を保存用の文字列にする
 * 鳴き元変換
 */
function archivedFromOf(tacha: Tacha): ArchivedFrom {
  switch (tacha) {
    case Tacha.Kamicha:
      return "kamicha";
    case Tacha.Toimen:
      return "toimen";
    case Tacha.Shimocha:
      return "shimocha";
  }
}

/**
 * 保存用の鳴き元をライブラリの `Tacha` に戻す
 * 鳴き元復元
 */
function tachaOf(from: ArchivedFrom): Tacha {
  switch (from) {
    case "kamicha":
      return Tacha.Kamicha;
    case "toimen":
      return Tacha.Toimen;
    case "shimocha":
      return Tacha.Shimocha;
  }
}

/**
 * 副露・槓を保存用の形にする
 * 副露保存変換
 *
 * 加槓の加槓牌・ポンと槓の鳴いた牌は `hais` と同じ牌種なので落とす。チーの
 * 鳴き元は上家に決まっているので落とす。
 *
 * 手牌の `exposed` には鳴いた面子と槓子しか入らない（`isExposedMentsu`）。
 * 鳴いていない順子・刻子が入っていたら、暗槓に見せかけた 3 枚の要素にして
 * 返す。正しい副露を作り上げずに、保存時の検証（槓は 4 枚）で落とすため。
 */
export function toArchivedMeld(mentsu: CompletedMentsu): ArchivedMeld {
  const hais: number[] = [...mentsu.hais];
  const { furo } = mentsu;
  if (!furo) return { type: "ankan", hais };
  switch (furo.type) {
    case FuroType.Chi:
      return { type: "chi", hais, nakiHai: furo.nakiHai };
    case FuroType.Pon:
      return { type: "pon", hais, from: archivedFromOf(furo.from) };
    case FuroType.Daiminkan:
      return { type: "daiminkan", hais, from: archivedFromOf(furo.from) };
    case FuroType.Kakan:
      return { type: "kakan", hais, from: archivedFromOf(furo.from) };
  }
}

/** 牌種 ID の列に絞る。範囲外の値が 1 つでもあれば undefined */
export function toHaiKindIds(
  values: readonly number[],
): HaiKindId[] | undefined {
  const ids: HaiKindId[] = [];
  for (const value of values) {
    if (!isHaiKindId(value)) return undefined;
    ids.push(value);
  }
  return ids;
}

/** 同種 3 枚なら牌種を返す */
function sameKindOf3(ids: readonly HaiKindId[]): HaiKindId | undefined {
  if (ids.length !== 3) return undefined;
  const [first] = ids;
  return ids.every((id) => id === first) ? first : undefined;
}

/** 同種 4 枚なら牌種を返す */
function sameKindOf4(ids: readonly HaiKindId[]): HaiKindId | undefined {
  if (ids.length !== 4) return undefined;
  const [first] = ids;
  return ids.every((id) => id === first) ? first : undefined;
}

/**
 * 同色の連番 3 枚（昇順）なら順子の牌を返す
 * 順子判定
 *
 * 字牌は順子にならない。色の境目（9m・1p など）を跨ぐ並びも数値では
 * 連番に見えるので、牌の種類（萬子・筒子・索子）が揃っているかで弾く。
 */
function shuntsuHaisOf(
  ids: readonly HaiKindId[],
): readonly [HaiKindId, HaiKindId, HaiKindId] | undefined {
  if (ids.length !== 3) return undefined;
  const [a, b, c] = ids;
  if (!isSuupai(a) || !isSuupai(b) || !isSuupai(c)) return undefined;
  const type = kindIdToHaiType(a);
  if (kindIdToHaiType(b) !== type || kindIdToHaiType(c) !== type) {
    return undefined;
  }
  if (b !== a + 1 || c !== b + 1) return undefined;
  return [a, b, c];
}

/**
 * 保存用の副露・槓をライブラリの面子に戻す（構造が不正なら undefined）
 * 副露復元
 *
 * 構造の規則: チーは同色の連番 3 枚（昇順）で鳴いた牌を含む、ポンは同種 3 枚、
 * 大明槓・加槓・暗槓は同種 4 枚。ポン・槓の鳴いた牌と加槓牌は `hais` の牌種で埋め、
 * チーの鳴き元は上家にする（{@link toArchivedMeld} の逆）。
 */
export function fromArchivedMeld(
  meld: ArchivedMeld,
): CompletedMentsu | undefined {
  const ids = toHaiKindIds(meld.hais);
  if (!ids) return undefined;
  switch (meld.type) {
    case "chi": {
      const hais = shuntsuHaisOf(ids);
      const { nakiHai } = meld;
      if (!hais || !isHaiKindId(nakiHai) || !hais.includes(nakiHai)) {
        return undefined;
      }
      return {
        type: MentsuType.Shuntsu,
        hais,
        furo: { type: FuroType.Chi, from: Tacha.Kamicha, nakiHai },
      };
    }
    case "pon": {
      const hai = sameKindOf3(ids);
      if (hai === undefined) return undefined;
      return {
        type: MentsuType.Koutsu,
        hais: [hai, hai, hai],
        furo: { type: FuroType.Pon, from: tachaOf(meld.from), nakiHai: hai },
      };
    }
    case "daiminkan": {
      const hai = sameKindOf4(ids);
      if (hai === undefined) return undefined;
      return {
        type: MentsuType.Kantsu,
        hais: [hai, hai, hai, hai],
        furo: {
          type: FuroType.Daiminkan,
          from: tachaOf(meld.from),
          nakiHai: hai,
        },
      };
    }
    case "kakan": {
      const hai = sameKindOf4(ids);
      if (hai === undefined) return undefined;
      return {
        type: MentsuType.Kantsu,
        hais: [hai, hai, hai, hai],
        furo: {
          type: FuroType.Kakan,
          from: tachaOf(meld.from),
          nakiHai: hai,
          kakanHai: hai,
        },
      };
    }
    case "ankan": {
      const hai = sameKindOf4(ids);
      if (hai === undefined) return undefined;
      return { type: MentsuType.Kantsu, hais: [hai, hai, hai, hai] };
    }
  }
}
