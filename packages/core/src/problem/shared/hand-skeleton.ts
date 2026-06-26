import { MentsuType, type HaiKindId } from "@pai-forge/riichi-mahjong";
import { isHaiKindId } from "../../core/type-guards";
import type { HaiUsageTracker } from "../../core/hai-tracker";
import {
  createRandomMentsu,
  type MentsuResult,
  type MentsuWeights,
} from "../mentsu-fu/mentsu-factory";

/** 面子・雀頭生成のリトライ上限 */
const MAX_RETRY = 50;

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
 */
export function generateMentsuSet(
  tracker: HaiUsageTracker,
  weights: Readonly<MentsuWeights>,
  count = 4,
): MentsuResult[] | undefined {
  const results: MentsuResult[] = [];

  for (let i = 0; i < count; i++) {
    let found: MentsuResult | undefined;

    for (let retry = 0; retry < MAX_RETRY; retry++) {
      const result = createRandomMentsu(weights);
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
        for (const t of tiles) tracker.use(t, 1);
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
 */
export function generatePairTile(
  tracker: HaiUsageTracker,
): HaiKindId | undefined {
  for (let retry = 0; retry < MAX_RETRY; retry++) {
    const t = Math.floor(Math.random() * 34);
    if (!isHaiKindId(t)) continue;
    if (tracker.canUse(t, 2)) {
      tracker.use(t, 2);
      return t;
    }
  }
  return undefined;
}

/**
 * 和了牌を手牌から選択する
 * 和了牌選択
 *
 * 副露牌は鳴いた時点で確定しており、アンカンは4枚すべて使い切るため、
 * どちらも5枚目以降が存在せず和了牌にはなり得ない。雀頭と暗面子（槓子以外）からのみ選ぶ。
 *
 * @param mentsuList - 生成済みの面子（雀頭は含まない）
 * @param pairTile - 雀頭の牌種
 */
export function pickAgariHai(
  mentsuList: readonly MentsuResult[],
  pairTile: HaiKindId,
): HaiKindId {
  const candidates: HaiKindId[] = [pairTile, pairTile];
  for (const r of mentsuList) {
    const isOpen = !!r.mentsu.furo;
    if (!isOpen && r.mentsu.type !== MentsuType.Kantsu) {
      candidates.push(...r.mentsu.hais);
    }
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}
