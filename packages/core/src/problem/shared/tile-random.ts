import { HaiKind, type HaiKindId } from "@pai-forge/riichi-mahjong";
import { ALL_HAI_KINDS, SUIT_BASES } from "../../core/constants";
import type { HaiUsageTracker } from "../../core/hai-tracker";
import {
  randomInt,
  randomChoice,
  defaultRandomSource,
  type RandomSource,
} from "../../core/random";
import { isHaiKindId, validateHaiKindId } from "../../core/type-guards";

/**
 * 么九牌（端牌＋字牌）
 * 么九牌リスト
 */
const YAOCHU: readonly HaiKindId[] = [
  HaiKind.ManZu1,
  HaiKind.ManZu9,
  HaiKind.PinZu1,
  HaiKind.PinZu9,
  HaiKind.SouZu1,
  HaiKind.SouZu9,
  HaiKind.Ton,
  HaiKind.Nan,
  HaiKind.Sha,
  HaiKind.Pei,
  HaiKind.Haku,
  HaiKind.Hatsu,
  HaiKind.Chun,
].filter(isHaiKindId);

/**
 * ランダムな中張牌（2〜8）を生成する
 * 中張牌生成
 *
 * @param rng - 乱数供給源（既定 `Math.random`）
 */
export function randomSimple(
  rng: RandomSource = defaultRandomSource,
): HaiKindId {
  const base = randomChoice(SUIT_BASES, rng);
  const num = randomInt(2, 8, rng);
  const id = base + num - 1;
  return validateHaiKindId(id).unwrapOr(HaiKind.ManZu5);
}

/**
 * ランダムな么九牌（1,9,字牌）を生成する
 * 么九牌生成
 *
 * @param rng - 乱数供給源（既定 `Math.random`）
 */
export function randomYaochu(
  rng: RandomSource = defaultRandomSource,
): HaiKindId {
  return randomChoice(YAOCHU, rng);
}

/**
 * 全34種からランダムな牌種IDを生成する
 * ランダム牌種生成
 *
 * @param rng - 乱数供給源（既定 `Math.random`）
 */
export function randomHaiKindId(
  rng: RandomSource = defaultRandomSource,
): HaiKindId {
  return randomChoice(ALL_HAI_KINDS, rng);
}

/**
 * トラッカーで count 枚使える牌種からランダムに 1 つ選び、使用登録する
 * 使用可能牌の抽選
 *
 * 同じ牌は 4 枚しかない、という制約を守って牌を引く唯一の入口。手牌の
 * 面子・雀頭（刻子=3, 槓子=4, 対子=2）も、山から取るドラ表示牌（1）も
 * ここを通る。候補が無い、または使用登録に失敗した場合は undefined を返す。
 *
 * @param tracker - 牌使用状況トラッカー（成功時に count 枚使用登録する）
 * @param count - 必要枚数
 * @param rng - 乱数供給源（既定 `Math.random`）
 */
export function pickAvailableHai(
  tracker: HaiUsageTracker,
  count: number,
  rng: RandomSource = defaultRandomSource,
): HaiKindId | undefined {
  const candidates = ALL_HAI_KINDS.filter((hai) => tracker.canUse(hai, count));
  if (candidates.length === 0) return undefined;

  const hai = randomChoice(candidates, rng);
  if (tracker.use(hai, count).isErr()) return undefined;
  return hai;
}

/**
 * 指定した牌を除く33種からランダムな牌種IDを生成する
 * 相違牌生成
 *
 * @param exclude - 除外する牌種ID
 * @param rng - 乱数供給源（既定 `Math.random`）
 */
export function randomHaiKindIdExcluding(
  exclude: HaiKindId,
  rng: RandomSource = defaultRandomSource,
): HaiKindId {
  let hai = randomHaiKindId(rng);
  while (hai === exclude) {
    hai = randomHaiKindId(rng);
  }
  return hai;
}
