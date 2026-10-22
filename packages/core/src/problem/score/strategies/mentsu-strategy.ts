import {
  MentsuType,
  type HaiKindId,
  type Tehai14,
  type CompletedMentsu,
} from "@pai-forge/riichi-mahjong";
import {
  randomChoice,
  randomInt,
  defaultRandomSource,
  type RandomSource,
} from "../../../core/random";
import { HaiUsageTracker } from "../../../core/hai-tracker";
import { finalizeTehai14, isExposedMentsu } from "../../shared/hand-skeleton";
import {
  generateWeightedMentsu,
  generateToitsu,
} from "../utils/shape-generator";
import type { MentsuWeights } from "../../shared/pick-mentsu-type";

/** 点数計算練習の面子重み（順子: 65%, 刻子: 30%, 残り5% 槓子） */
const SCORE_MENTSU_WEIGHTS: MentsuWeights = { shuntsu: 0.65, koutsu: 0.3 };

/**
 * 面子の構造情報
 * 面子構造
 */
interface MentsuShape {
  readonly type:
    | typeof MentsuType.Shuntsu
    | typeof MentsuType.Koutsu
    | typeof MentsuType.Kantsu;
  readonly hais: readonly HaiKindId[];
  readonly isFuro: boolean;
}

/**
 * 手牌の構造情報
 * 手牌構造
 */
interface HandStructure {
  readonly mentsuList: readonly MentsuShape[];
  readonly pair: HaiKindId;
  readonly agariTarget: {
    readonly type: "mentsu" | "pair";
    readonly index: number;
  };
}

/** 和了牌の候補（どの面子・雀頭を完成させる牌か） */
interface AgariCandidate {
  readonly hai: HaiKindId;
  readonly target: HandStructure["agariTarget"];
}

/**
 * 和了牌の候補を列挙する
 * 和了牌候補列挙
 *
 * 副露した面子と槓子は候補にしない（鳴いた時点で確定しており、槓子は 4 枚を
 * 使い切る）。雀頭は 2 枚ぶん載せ、面子の牌と同じ重みで選ばれるようにする。
 */
function listAgariCandidates(
  mentsuList: readonly MentsuShape[],
  pair: HaiKindId,
): readonly AgariCandidate[] {
  const fromMentsu = mentsuList.flatMap(
    (m, index): readonly AgariCandidate[] =>
      m.isFuro || m.type === MentsuType.Kantsu
        ? []
        : m.hais.map((hai) => ({ hai, target: { type: "mentsu", index } })),
  );
  const pairTarget = { type: "pair", index: 0 } as const;
  return [
    ...fromMentsu,
    { hai: pair, target: pairTarget },
    { hai: pair, target: pairTarget },
  ];
}

/**
 * 面子手生成結果
 * 面子手生成結果
 */
export interface MentsuTehaiResult {
  readonly tehai: Tehai14;
  readonly agariHai: HaiKindId;
  readonly structure: HandStructure;
}

/**
 * 面子手（4面子1雀頭）をランダムに生成する
 * 面子手生成
 *
 * @param includeFuro - 副露を含めるかどうか
 * @param rng - 乱数供給源（既定 `Math.random`）
 */
export function generateMentsuTehai(
  includeFuro: boolean,
  rng: RandomSource = defaultRandomSource,
): MentsuTehaiResult | undefined {
  const tracker = new HaiUsageTracker();
  const closedHais: HaiKindId[] = [];
  const exposed: CompletedMentsu[] = [];
  const structuralMentsu: MentsuShape[] = [];

  // 副露の数を決定（0-2）
  const furoCount = includeFuro ? randomInt(0, 2, rng) : 0;

  // 4面子を生成
  for (let i = 0; i < 4; i++) {
    const isFuro = i < furoCount;
    const mentsu = generateWeightedMentsu(
      tracker,
      SCORE_MENTSU_WEIGHTS,
      isFuro,
      rng,
    );

    if (!mentsu) return undefined;

    structuralMentsu.push({
      type: mentsu.type,
      hais: mentsu.hais,
      isFuro: !!mentsu.furo,
    });

    if (isExposedMentsu(mentsu)) {
      exposed.push(mentsu);
    } else {
      closedHais.push(...mentsu.hais);
    }
  }

  // 雀頭を生成
  const toitsuHai = generateToitsu(tracker, rng);
  if (toitsuHai === undefined) return undefined;
  closedHais.push(toitsuHai, toitsuHai);

  // 和了牌を決定
  const selected = randomChoice(
    listAgariCandidates(structuralMentsu, toitsuHai),
    rng,
  );
  const agariHai = selected.hai;
  const agariTarget = selected.target;

  const structure: HandStructure = {
    mentsuList: structuralMentsu,
    pair: toitsuHai,
    agariTarget,
  };

  const tehai = finalizeTehai14(closedHais, exposed);
  if (tehai === undefined) return undefined;
  return { tehai, agariHai, structure };
}
