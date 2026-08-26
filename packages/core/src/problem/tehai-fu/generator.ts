import {
  MentsuType,
  isYaochu,
  type HaiKindId,
  type CompletedMentsu,
} from "@pai-forge/riichi-mahjong";
import type { TehaiFuQuestion, TehaiFuItem } from "./types";
import { BAKAZE_OPTIONS, KAZEHAI } from "../../core/constants";
import { randomBool, randomChoice } from "../../core/random";
import { HaiUsageTracker } from "../../core/hai-tracker";
import {
  calculateMentsuFu,
  isOpenMentsuForFu,
} from "../../core/score-calculation";
import { calculateJantouFu } from "../shared/jantou-fu";
import { defaultIdGenerator, type IdGenerator } from "../../core/id";
import {
  finalizeTehai14,
  generateMentsuSet,
  generatePairTile,
  pickAgariHai,
  pickRonAgariHai,
} from "../shared/hand-skeleton";

/** 手牌符練習用の面子生成重み（20%順子, 50%刻子, 30%槓子） */
const TEHAI_FU_MENTSU_WEIGHTS = { shuntsu: 0.2, koutsu: 0.5 } as const;

/**
 * 手牌の符計算問題を生成する
 * 手牌符問題ジェネレータ
 *
 * @param options.renfonpaiAs4Fu - 連風牌の雀頭を4符として扱うか（既定 false=2符）
 * @param options.idGen - 問題・回答行 ID の採番（既定 crypto.randomUUID）
 */
export function generateTehaiFuQuestion(
  options: {
    readonly renfonpaiAs4Fu?: boolean;
    readonly idGen?: IdGenerator;
  } = {},
): TehaiFuQuestion | undefined {
  const { renfonpaiAs4Fu = false, idGen = defaultIdGenerator } = options;
  const tracker = new HaiUsageTracker();

  // 1. 4面子を生成
  const mentsuList = generateMentsuSet(tracker, TEHAI_FU_MENTSU_WEIGHTS);
  if (!mentsuList) return undefined;

  // 2. コンテキスト生成
  const bakaze = randomChoice(BAKAZE_OPTIONS);
  const jikaze = randomChoice(KAZEHAI);

  // 3. 雀頭を生成
  const headTile = generatePairTile(tracker);
  if (headTile === undefined) return undefined;

  // 4. 和了状況を決める。ロンかツモかで刻子の明暗（＝符）が変わるため、
  //    回答行の符を確定させる前に和了牌まで決めておく。
  const isTsumo = randomBool(0.5);
  const agariHai = isTsumo
    ? pickAgariHai(mentsuList, headTile)
    : pickRonAgariHai(mentsuList, headTile);
  if (agariHai === undefined) return undefined;

  // 5. 回答行を作る
  const items: TehaiFuItem[] = mentsuList.map((result) => ({
    id: idGen(),
    tiles: [...result.mentsu.hais],
    type: result.mentsu.type,
    fu: mentsuFuInHand(result.mentsu, { agariHai, isTsumo }),
    // 副露しているかどうか（手牌の右に晒して表示するか）。ロンで明刻に
    // なった刻子は符の上では明でも、手牌では暗牌のまま並べる。
    isOpen: !!result.mentsu.furo,
    originalMentsu: result.mentsu,
  }));

  items.push({
    id: idGen(),
    tiles: [headTile, headTile],
    type: "Pair",
    fu: calculateJantouFu(headTile, bakaze, jikaze, renfonpaiAs4Fu),
    isOpen: false,
  });

  // 6. Tehai14 を構築
  const closed: HaiKindId[] = [];
  const exposed: CompletedMentsu[] = [];

  for (const item of items) {
    if (isExposedItem(item) && item.originalMentsu) {
      exposed.push(item.originalMentsu);
    } else {
      closed.push(...item.tiles);
    }
  }

  const tehai = finalizeTehai14(closed, exposed);
  if (tehai === undefined) return undefined;

  // 7. 回答行（items）を手牌の表示順に並べ替える。
  //    手牌は「昇順ソート済みの暗牌 → 副露（右側）」で表示されるため、
  //    暗牌側の面子・雀頭を牌の昇順で、続けて副露を tehai.exposed の順に並べる。
  //    これにより回答行が手牌の左から右の見た目と対応する。
  const orderedItems = orderItemsByHandLayout(items);

  return {
    id: idGen(),
    tehai,
    context: { bakaze, jikaze, agariHai, isTsumo },
    items: orderedItems,
  };
}

/**
 * 和了状況を織り込んだ、その面子の符
 * 面子符（和了状況込み）
 *
 * 面子は和了牌が決まる前に生成されるため、生成時点の符は「ロンで完成した
 * 刻子は明刻」の読み替えを含まない。符を答えさせる以上、ここで取り直す。
 */
function mentsuFuInHand(
  mentsu: CompletedMentsu,
  context: { readonly agariHai: HaiKindId; readonly isTsumo: boolean },
): number {
  if (mentsu.type === MentsuType.Shuntsu) return 0;
  return calculateMentsuFu({
    isKantsu: mentsu.type === MentsuType.Kantsu,
    isOpen: isOpenMentsuForFu(mentsu, context),
    isYaochu: isYaochu(mentsu.hais[0]),
  });
}

/** その要素が手牌上で副露（右側）として表示されるか */
function isExposedItem(item: TehaiFuItem): boolean {
  return (
    (item.isOpen || item.type === MentsuType.Kantsu) && !!item.originalMentsu
  );
}

/** ソート済みの牌配列同士を辞書順で比較する */
function compareTilesAsc(
  a: readonly HaiKindId[],
  b: readonly HaiKindId[],
): number {
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  const len = Math.min(sa.length, sb.length);
  for (let i = 0; i < len; i++) {
    if (sa[i] !== sb[i]) return sa[i] - sb[i];
  }
  return sa.length - sb.length;
}

/**
 * 回答行を手牌の表示順（暗牌を牌の昇順 → 副露を生成順）に並べ替える
 * 手牌レイアウト整列
 */
function orderItemsByHandLayout(items: readonly TehaiFuItem[]): TehaiFuItem[] {
  const closedItems = items.filter((it) => !isExposedItem(it));
  const exposedItems = items.filter((it) => isExposedItem(it));
  closedItems.sort((a, b) => compareTilesAsc(a.tiles, b.tiles));
  return [...closedItems, ...exposedItems];
}
