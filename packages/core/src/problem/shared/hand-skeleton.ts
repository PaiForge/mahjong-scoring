import {
  MentsuType,
  validateTehai14,
  type CompletedMentsu,
  type HaiKindId,
  type Tehai14,
} from "@pai-forge/riichi-mahjong";
import {
  randomChoice,
  defaultRandomSource,
  type RandomSource,
} from "../../core/random";
import { randomHaiKindId } from "./tile-random";
import type { HaiUsageTracker } from "../../core/hai-tracker";
import {
  createRandomMentsu,
  type MentsuResult,
  type MentsuWeights,
} from "../mentsu-fu/mentsu-factory";

/** 面子・雀頭生成のリトライ上限 */
const MAX_RETRY = 50;

/**
 * その面子が副露側（手牌の右に晒される）かどうか
 * 副露判定
 *
 * 鳴いた面子と槓子は晒される。暗槓も4枚を並べて見せるため exposed 扱い。
 * 手牌構築でこの区分を判断する唯一の定義。
 */
export function isExposedMentsu(mentsu: CompletedMentsu): boolean {
  return !!mentsu.furo || mentsu.type === MentsuType.Kantsu;
}

/**
 * 暗牌を理牌して Tehai14 として検証する（不正な手牌は undefined）
 * 手牌確定
 *
 * @param closed - 暗牌（雀頭を含む）。この関数内でコピーしてソートする
 * @param exposed - 副露・槓子
 */
export function finalizeTehai14(
  closed: readonly HaiKindId[],
  exposed: readonly CompletedMentsu[],
): Tehai14 | undefined {
  const sorted = [...closed].sort((a, b) => a - b);
  const result = validateTehai14({ closed: sorted, exposed: [...exposed] });
  return result.isErr() ? undefined : result.value;
}

/**
 * 面子リストと雀頭から Tehai14 を組み立てる（不正な手牌は undefined）
 * 手牌構築
 *
 * 副露・槓子を exposed、残りと雀頭を closed に振り分けて確定する。
 *
 * @param mentsuList - 生成済みの面子（雀頭は含まない）
 * @param pairTile - 雀頭の牌種
 */
export function buildTehai14(
  mentsuList: readonly MentsuResult[],
  pairTile: HaiKindId,
): Tehai14 | undefined {
  const closed: HaiKindId[] = [pairTile, pairTile];
  const exposed: CompletedMentsu[] = [];

  for (const { mentsu } of mentsuList) {
    if (isExposedMentsu(mentsu)) {
      exposed.push(mentsu);
    } else {
      closed.push(...mentsu.hais);
    }
  }

  return finalizeTehai14(closed, exposed);
}

/**
 * トラッカーで使用可能性を確認しながら、重み付きランダム面子を count 個生成する
 * 面子セット生成
 *
 * 生成に成功した牌はトラッカーに使用登録される。所定回数リトライしても
 * 必要数を揃えられない場合は undefined を返す。
 *
 * @param tracker - 牌の使用状況トラッカー（呼び出し側が用意した同一インスタンスを更新する）
 * @param weights - 面子種別の確率重み
 * @param count - 生成する面子数（既定 4）
 * @param rng - 乱数供給源（既定 `Math.random`）
 */
export function generateMentsuSet(
  tracker: HaiUsageTracker,
  weights: Readonly<MentsuWeights>,
  count = 4,
  rng: RandomSource = defaultRandomSource,
): MentsuResult[] | undefined {
  const results: MentsuResult[] = [];

  for (let i = 0; i < count; i++) {
    let found: MentsuResult | undefined;

    for (let retry = 0; retry < MAX_RETRY; retry++) {
      const result = createRandomMentsu(weights, rng);
      const tiles = result.mentsu.hais;

      const tempCount = new Map<HaiKindId, number>();
      for (const t of tiles) tempCount.set(t, (tempCount.get(t) ?? 0) + 1);

      let possible = true;
      for (const [t, c] of tempCount.entries()) {
        if (!tracker.canUse(t, c)) {
          possible = false;
          break;
        }
      }

      if (possible) {
        // canUse で確保できると確認済みだが、use の Result を捨てると
        // 上限超過を検知できないまま牌が5枚使われた手牌ができてしまう。
        // 起きないはずの失敗も握り潰さず、生成そのものを諦める。
        for (const t of tiles) {
          if (tracker.use(t, 1).isErr()) return undefined;
        }
        found = result;
        break;
      }
    }

    if (!found) return undefined;
    results.push(found);
  }

  return results;
}

/**
 * トラッカーで使用可能な雀頭牌をランダムに1つ選び、2枚使用登録する
 * 雀頭牌生成
 *
 * @param tracker - 牌の使用状況トラッカー（生成成功時に2枚使用登録する）
 * @param rng - 乱数供給源（既定 `Math.random`）
 */
export function generatePairTile(
  tracker: HaiUsageTracker,
  rng: RandomSource = defaultRandomSource,
): HaiKindId | undefined {
  for (let retry = 0; retry < MAX_RETRY; retry++) {
    const t = randomHaiKindId(rng);
    // canUse と use で同じ上限判定を二重に持たない。use は確保できない場合
    // 使用枚数を変えずに Err を返すので、その結果だけで分岐できる。
    if (tracker.use(t, 2).isOk()) return t;
  }
  return undefined;
}

/**
 * 和了牌の候補（雀頭2枚と暗面子の牌）を列挙する
 * 和了牌候補
 *
 * 副露牌は鳴いた時点で確定しており、アンカンは4枚すべて使い切るため、
 * どちらも5枚目以降が存在せず和了牌にはなり得ない。
 */
function agariHaiCandidates(
  mentsuList: readonly MentsuResult[],
  pairTile: HaiKindId,
): HaiKindId[] {
  return [
    pairTile,
    pairTile,
    ...mentsuList
      .filter((r) => !isExposedMentsu(r.mentsu))
      .flatMap((r) => r.mentsu.hais),
  ];
}

/**
 * 和了牌を手牌から選択する
 * 和了牌選択
 *
 * ツモ和了、または和了牌が符に影響しない練習向け。ロン和了の符を問う
 * 出題では {@link pickRonAgariHai} を使うこと。
 *
 * @param mentsuList - 生成済みの面子（雀頭は含まない）
 * @param pairTile - 雀頭の牌種
 * @param rng - 乱数供給源（既定 `Math.random`）
 */
export function pickAgariHai(
  mentsuList: readonly MentsuResult[],
  pairTile: HaiKindId,
  rng: RandomSource = defaultRandomSource,
): HaiKindId {
  return randomChoice(agariHaiCandidates(mentsuList, pairTile), rng);
}

/**
 * ロン和了の和了牌を、符が一意に決まる牌に限って選択する
 * ロン和了牌選択
 *
 * ロンで完成した刻子は明刻として数えるため、同じ牌種が暗刻と暗順子の
 * 両方にある手（例: 二索の暗刻 + 一二三索）でロン牌をその牌種にすると、
 * 「順子を完成させた（暗刻のまま4符）」とも「刻子を完成させた（明刻で2符）」
 * とも読めて正解が定まらない。この曖昧な牌種を候補から外す。
 *
 * 候補が残らない手は出題として成立しないため undefined を返す（呼び出し側は
 * 手牌ごと生成し直す）。曖昧になるのは暗刻の牌種だけで、その牌種は雀頭には
 * 使えない（5枚目になる）ため、実際には雀頭が候補として必ず残る。
 *
 * @param mentsuList - 生成済みの面子（雀頭は含まない）
 * @param pairTile - 雀頭の牌種
 * @param rng - 乱数供給源（既定 `Math.random`）
 */
export function pickRonAgariHai(
  mentsuList: readonly MentsuResult[],
  pairTile: HaiKindId,
  rng: RandomSource = defaultRandomSource,
): HaiKindId | undefined {
  const closedGroups = mentsuList
    .filter((r) => !isExposedMentsu(r.mentsu))
    .map((r) => r.mentsu.hais);

  const ambiguous = new Set<HaiKindId>();
  for (const r of mentsuList) {
    if (r.mentsu.furo || r.mentsu.type !== MentsuType.Koutsu) continue;
    const tile = r.mentsu.hais[0];
    const groups = closedGroups.filter((hais) => hais.includes(tile)).length;
    if (groups > 1) ambiguous.add(tile);
  }

  const candidates = agariHaiCandidates(mentsuList, pairTile).filter(
    (t) => !ambiguous.has(t),
  );
  if (candidates.length === 0) return undefined;
  return randomChoice(candidates, rng);
}
