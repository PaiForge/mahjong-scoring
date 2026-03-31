import {
  MentsuType,
  validateTehai14,
  type HaiKindId,
  type Tehai14,
  type CompletedMentsu,
} from "@pai-forge/riichi-mahjong";
import { randomChoice } from "../../../core/random";
import { randomInt } from "../../../core/random";
import { HaiUsageTracker } from "../../../core/hai-tracker";
import {
  generateShuntsu,
  generateKoutsu,
  generateKantsu,
  generateToitsu,
} from "../utils/shape-generator";

/**
 * 面子の構造情報
 * 面子構造
 */
interface MentsuShape {
  readonly type: typeof MentsuType.Shuntsu | typeof MentsuType.Koutsu | typeof MentsuType.Kantsu;
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
 */
export function generateMentsuTehai(includeFuro: boolean): MentsuTehaiResult | undefined {
  const tracker = new HaiUsageTracker();
  const closedHais: HaiKindId[] = [];
  const exposed: CompletedMentsu[] = [];
  const structuralMentsu: MentsuShape[] = [];

  // 副露の数を決定（0-2）
  const furoCount = includeFuro ? randomInt(0, 2) : 0;

  // 4面子を生成
  for (let i = 0; i < 4; i++) {
    const isFuro = i < furoCount;
    // 面子の種類を決定（順子: 65%, 刻子: 30%, 槓子: 5%）
    const rand = Math.random();
    const isShuntsu = rand < 0.65;
    const isKantsu = rand >= 0.95;

    let mentsu: CompletedMentsu | undefined;
    if (isShuntsu) {
      mentsu = generateShuntsu(tracker, isFuro) ?? generateKoutsu(tracker, isFuro);
    } else if (isKantsu) {
      mentsu = generateKantsu(tracker, isFuro) ?? generateKoutsu(tracker, isFuro) ?? generateShuntsu(tracker, isFuro);
    } else {
      mentsu = generateKoutsu(tracker, isFuro) ?? generateShuntsu(tracker, isFuro);
    }

    if (!mentsu) return undefined;

    structuralMentsu.push({
      type: mentsu.type,
      hais: mentsu.hais,
      isFuro: !!mentsu.furo,
    });

    if (mentsu.furo || mentsu.type === MentsuType.Kantsu) {
      exposed.push(mentsu);
    } else {
      closedHais.push(...mentsu.hais);
    }
  }

  // 雀頭を生成
  const toitsuHai = generateToitsu(tracker);
  if (toitsuHai === undefined) return undefined;
  closedHais.push(toitsuHai, toitsuHai);

  // 理牌
  closedHais.sort((a, b) => a - b);

  // 和了牌の候補を収集
  const candidates: { readonly hai: HaiKindId; readonly target: { readonly type: "mentsu" | "pair"; readonly index: number } }[] = [];

  // 面子からの候補
  for (let idx = 0; idx < structuralMentsu.length; idx++) {
    const m = structuralMentsu[idx];
    if (!m.isFuro && m.type !== MentsuType.Kantsu) {
      for (const hai of m.hais) {
        candidates.push({ hai, target: { type: "mentsu", index: idx } });
      }
    }
  }

  // 雀頭からの候補
  candidates.push(
    { hai: toitsuHai, target: { type: "pair", index: 0 } },
    { hai: toitsuHai, target: { type: "pair", index: 0 } },
  );

  // 和了牌を決定
  const selected = randomChoice(candidates);
  const agariHai = selected.hai;
  const agariTarget = selected.target;

  const structure: HandStructure = {
    mentsuList: structuralMentsu,
    pair: toitsuHai,
    agariTarget,
  };

  const tehai = { closed: closedHais, exposed };
  const result = validateTehai14(tehai);
  if (result.isErr()) return undefined;
  return { tehai: result.value, agariHai, structure };
}
