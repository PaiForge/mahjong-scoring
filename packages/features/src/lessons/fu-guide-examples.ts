/**
 * 符の 4 章（雀頭・面子・待ち・手牌）の本文に並べる例の牌
 * 符の章の例示
 *
 * 例の牌・和了牌・符の値だけをここに置き、表の見出し・行の文言（辞書キー）・
 * 体裁はアプリが持つ。web とモバイルのレッスンは同じ章を別々に描くため、
 * 牌を JSX に直接書くと 1 枚直すたびに両方を直すことになる。各例は名前で
 * 引き、並び順は描く側の JSX が決める。
 */

import {
  HaiKind,
  type CompletedMentsu,
  type HaiKindId,
} from "@mahjong-scoring/core";

import {
  exampleAnkan,
  exampleAnkou,
  exampleMinkan,
  exampleMinkou,
  exampleShuntsu,
} from "../board/example-mentsu";

/** 雀頭の例 1 つ（対子の 2 枚と、東場・南家で数えたときの符） */
export interface JantouFuExample {
  readonly tiles: readonly [HaiKindId, HaiKindId];
  readonly fu: number;
}

/**
 * 雀頭の章（`jantouFu.learn`）の例
 *
 * 場風・自風の例は東場の南家として数える（東が場風・南が自風・西が客風）。
 */
export const JANTOU_FU_EXAMPLES = {
  haku: { tiles: [HaiKind.Haku, HaiKind.Haku], fu: 2 },
  hatsu: { tiles: [HaiKind.Hatsu, HaiKind.Hatsu], fu: 2 },
  chun: { tiles: [HaiKind.Chun, HaiKind.Chun], fu: 2 },
  bakaze: { tiles: [HaiKind.Ton, HaiKind.Ton], fu: 2 },
  jikaze: { tiles: [HaiKind.Nan, HaiKind.Nan], fu: 2 },
  suuhaiManzu: { tiles: [HaiKind.ManZu1, HaiKind.ManZu1], fu: 0 },
  suuhaiPinzu: { tiles: [HaiKind.PinZu5, HaiKind.PinZu5], fu: 0 },
  otakaze: { tiles: [HaiKind.Sha, HaiKind.Sha], fu: 0 },
} as const satisfies Readonly<Record<string, JantouFuExample>>;

/** 面子の例 1 つ（卓上の並びを含む面子と、その符） */
export interface MentsuFuExample {
  readonly mentsu: CompletedMentsu;
  readonly fu: number;
}

/** 面子の章（`mentsuFu.learn`）の例 */
export const MENTSU_FU_EXAMPLES = {
  shuntsu: {
    mentsu: exampleShuntsu([HaiKind.ManZu2, HaiKind.ManZu3, HaiKind.ManZu4]),
    fu: 0,
  },
  koutsuOpenSimple: { mentsu: exampleMinkou(HaiKind.ManZu5), fu: 2 },
  koutsuClosedSimple: { mentsu: exampleAnkou(HaiKind.PinZu3), fu: 4 },
  koutsuOpenYaochu: { mentsu: exampleMinkou(HaiKind.Haku), fu: 4 },
  koutsuClosedYaochu: { mentsu: exampleAnkou(HaiKind.ManZu1), fu: 8 },
  kantsuOpenSimple: { mentsu: exampleMinkan(HaiKind.SouZu5), fu: 8 },
  kantsuClosedSimple: { mentsu: exampleAnkan(HaiKind.PinZu7), fu: 16 },
  kantsuOpenYaochu: { mentsu: exampleMinkan(HaiKind.Chun), fu: 16 },
  kantsuClosedYaochu: { mentsu: exampleAnkan(HaiKind.PinZu9), fu: 32 },
} as const satisfies Readonly<Record<string, MentsuFuExample>>;

/** 待ちの例 1 つ（聴牌時の手の内・和了牌・その待ちの符） */
export interface MachiFuExample {
  readonly tiles: readonly HaiKindId[];
  readonly agariHai: HaiKindId;
  readonly fu: number;
}

/**
 * 待ちの章（`machiFu.learn`）の例
 *
 * キーは待ちの形の名前。辺張は 12 の 3 待ち（確認問題は逆側の 89 の 7 待ちを
 * 出し、例の暗記ではなく形で答えさせる）。
 */
export const MACHI_FU_EXAMPLES = {
  kanchan: {
    tiles: [HaiKind.ManZu2, HaiKind.ManZu4],
    agariHai: HaiKind.ManZu3,
    fu: 2,
  },
  penchan: {
    tiles: [HaiKind.PinZu1, HaiKind.PinZu2],
    agariHai: HaiKind.PinZu3,
    fu: 2,
  },
  tanki: { tiles: [HaiKind.Haku], agariHai: HaiKind.Haku, fu: 2 },
  ryanmen: {
    tiles: [HaiKind.SouZu6, HaiKind.SouZu7],
    agariHai: HaiKind.SouZu5,
    fu: 0,
  },
  shanpon: {
    tiles: [HaiKind.Ton, HaiKind.Ton, HaiKind.Haku, HaiKind.Haku],
    agariHai: HaiKind.Ton,
    fu: 0,
  },
} as const satisfies Readonly<Record<string, MachiFuExample>>;

/** 手牌の章の例 1 つ（並べる牌・横向きにする位置・和了牌） */
export interface TehaiFuExampleTiles {
  readonly tiles: readonly HaiKindId[];
  /** 横向きに置く牌の位置（鳴いた面子を示す） */
  readonly rotatedIndex?: number;
  readonly agariHai?: HaiKindId;
}

/**
 * 手牌の章（`tehaiFu.learn`）の「合計を外す 3 つの場所」の例
 *
 * `ronKoutsu` はロンとツモの 2 つの例で同じ牌を並べ、和了り方だけで刻子の
 * 符が変わることを見せる。風の 3 例は雀頭の章と同じく東場の南家として読む。
 */
export const TEHAI_FU_EXAMPLES = {
  tsumo: {
    tiles: [HaiKind.PinZu2, HaiKind.PinZu3, HaiKind.PinZu4],
    rotatedIndex: 0,
    agariHai: HaiKind.SouZu6,
  },
  ronKoutsu: {
    tiles: [HaiKind.SouZu3, HaiKind.SouZu3, HaiKind.Haku, HaiKind.Haku],
    agariHai: HaiKind.SouZu3,
  },
  kazeBakaze: { tiles: [HaiKind.Ton, HaiKind.Ton] },
  kazeJikaze: { tiles: [HaiKind.Nan, HaiKind.Nan] },
  kazeOtakaze: { tiles: [HaiKind.Sha, HaiKind.Sha] },
} as const satisfies Readonly<Record<string, TehaiFuExampleTiles>>;
