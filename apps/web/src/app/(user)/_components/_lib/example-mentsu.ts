import {
  FuroType,
  MentsuType,
  Tacha,
  type CompletedMentsu,
  type HaiKindId,
} from "@mahjong-scoring/core";

/**
 * 例示の面子を鳴いた相手
 * 例示の鳴き元
 *
 * 横向きに置く牌の位置は鳴き元で決まる（上家なら左端・対面なら中央・下家なら
 * 右端）。例示が示したいのは「鳴いている」ことだけで誰から鳴いたかではない
 * ため、位置はここで 1 つに決める。面子符の出題も対面から鳴いた形を出すので、
 * 教本で見た並びがそのまま問題に出る。
 */
const EXAMPLE_FURO_FROM = Tacha.Toimen;

/**
 * 例示用の順子
 *
 * 順子は明順子でも暗順子でも符が変わらないため、鳴きを付けずに並べる。
 */
export function exampleShuntsu(
  hais: readonly [HaiKindId, HaiKindId, HaiKindId],
): CompletedMentsu {
  return { type: MentsuType.Shuntsu, hais };
}

/** 例示用の明刻（ポンで作った刻子。1 枚が横向きになる） */
export function exampleMinkou(hai: HaiKindId): CompletedMentsu {
  return {
    type: MentsuType.Koutsu,
    hais: [hai, hai, hai],
    furo: { type: FuroType.Pon, from: EXAMPLE_FURO_FROM },
  };
}

/** 例示用の暗刻 */
export function exampleAnkou(hai: HaiKindId): CompletedMentsu {
  return { type: MentsuType.Koutsu, hais: [hai, hai, hai] };
}

/** 例示用の明槓（大明槓。1 枚が横向きになる） */
export function exampleMinkan(hai: HaiKindId): CompletedMentsu {
  return {
    type: MentsuType.Kantsu,
    hais: [hai, hai, hai, hai],
    furo: { type: FuroType.Daiminkan, from: EXAMPLE_FURO_FROM },
  };
}

/** 例示用の暗槓（両端が伏せて描かれる） */
export function exampleAnkan(hai: HaiKindId): CompletedMentsu {
  return { type: MentsuType.Kantsu, hais: [hai, hai, hai, hai] };
}
