import {
  MentsuType,
  validateTehai14,
  type HaiKindId,
  type CompletedMentsu,
} from "@pai-forge/riichi-mahjong";
import type { TehaiFuQuestion, TehaiFuItem } from "./types";
import { KAZEHAI } from "../../core/constants";
import { HaiUsageTracker } from "../../core/hai-tracker";
import { calculateJantouFu } from "../shared/jantou-fu";
import {
  generateMentsuSet,
  generatePairTile,
  pickAgariHai,
} from "../shared/hand-skeleton";

/** 手牌符練習用の面子生成重み（20%順子, 50%刻子, 30%槓子） */
const TEHAI_FU_MENTSU_WEIGHTS = { shuntsu: 0.2, koutsu: 0.5 } as const;

/**
 * 手牌の符計算問題を生成する
 * 手牌符問題ジェネレータ
 *
 * @param options.renfonpaiAs4Fu - 連風牌の雀頭を4符として扱うか（既定 false=2符）
 */
export function generateTehaiFuQuestion(
  options: { readonly renfonpaiAs4Fu?: boolean } = {},
): TehaiFuQuestion | undefined {
  const { renfonpaiAs4Fu = false } = options;
  const tracker = new HaiUsageTracker();

  // 1. 4面子を生成
  const mentsuList = generateMentsuSet(tracker, TEHAI_FU_MENTSU_WEIGHTS);
  if (!mentsuList) return undefined;

  const items: TehaiFuItem[] = mentsuList.map((result) => ({
    id: crypto.randomUUID(),
    tiles: [...result.mentsu.hais],
    type: result.mentsu.type,
    fu: result.fu,
    explanation: result.explanation,
    isOpen: !!result.mentsu.furo,
    originalMentsu: result.mentsu,
  }));

  // 2. コンテキスト生成
  const bakaze = KAZEHAI[Math.floor(Math.random() * 4)];
  const jikaze = KAZEHAI[Math.floor(Math.random() * 4)];

  // 3. 雀頭を生成
  const headTile = generatePairTile(tracker);
  if (headTile === undefined) return undefined;

  const headFu = calculateJantouFu(headTile, bakaze, jikaze, renfonpaiAs4Fu);
  items.push({
    id: crypto.randomUUID(),
    tiles: [headTile, headTile],
    type: "Pair",
    fu: headFu.fu,
    explanation: headFu.explanation,
    isOpen: false,
  });

  // 4. Tehai14 を構築
  const closed: HaiKindId[] = [];
  const exposed: CompletedMentsu[] = [];

  for (const item of items) {
    if (item.type === "Pair") {
      closed.push(...item.tiles);
    } else if (
      (item.isOpen || item.type === MentsuType.Kantsu) &&
      item.originalMentsu
    ) {
      exposed.push(item.originalMentsu);
    } else {
      closed.push(...item.tiles);
    }
  }

  closed.sort((a, b) => a - b);

  const agariHai = pickAgariHai(mentsuList, headTile);

  const tehai = { closed, exposed };
  const result = validateTehai14(tehai);
  if (result.isErr()) return undefined;

  // 5. 回答行（items）を手牌の表示順に並べ替える。
  //    手牌は「昇順ソート済みの暗牌 → 副露（右側）」で表示されるため、
  //    暗牌側の面子・雀頭を牌の昇順で、続けて副露を tehai.exposed の順に並べる。
  //    これにより回答行が手牌の左から右の見た目と対応する。
  const orderedItems = orderItemsByHandLayout(items);

  return {
    id: crypto.randomUUID(),
    tehai: result.value,
    context: { bakaze, jikaze, agariHai, isTsumo: Math.random() < 0.5 },
    items: orderedItems,
  };
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
