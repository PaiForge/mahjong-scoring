import {
  MentsuType,
  validateTehai14,
  type HaiKindId,
  type Kazehai,
  type CompletedMentsu,
} from "@pai-forge/riichi-mahjong";
import type { TehaiFuQuestion, TehaiFuItem } from "./types";
import { createRandomMentsu } from "../mentsu-fu/mentsu-factory";
import { KAZEHAI } from "../../core/constants";
import { isHaiKindId } from "../../core/type-guards";
import { HaiUsageTracker } from "../../core/hai-tracker";
import { calculateJantouFu } from "../shared/jantou-fu";

/** 手牌符ドリル用の面子生成重み（20%順子, 50%刻子, 30%槓子） */
const TEHAI_FU_MENTSU_WEIGHTS = { shuntsu: 0.2, koutsu: 0.5 } as const;

/**
 * 手牌の符計算問題を生成する
 * 手牌符問題ジェネレータ
 */
export function generateTehaiFuQuestion(): TehaiFuQuestion | undefined {
  const tracker = new HaiUsageTracker();

  const items: TehaiFuItem[] = [];

  // 1. 4面子を生成
  for (let i = 0; i < 4; i++) {
    let item: TehaiFuItem | undefined;

    for (let retry = 0; retry < 50; retry++) {
      const result = createRandomMentsu(TEHAI_FU_MENTSU_WEIGHTS);
      const tiles = result.mentsu.hais;

      // 牌の使用可能性チェック
      const tempCount = new Map<HaiKindId, number>();
      for (const t of tiles)
        tempCount.set(t, (tempCount.get(t) ?? 0) + 1);

      let possible = true;
      for (const [t, c] of tempCount.entries()) {
        if (!tracker.canUse(t, c)) {
          possible = false;
          break;
        }
      }

      if (possible) {
        for (const t of tiles) tracker.use(t, 1);
        item = {
          id: crypto.randomUUID(),
          tiles: [...tiles],
          type: result.mentsu.type,
          fu: result.fu,
          explanation: result.explanation,
          isOpen: !!result.mentsu.furo,
          originalMentsu: result.mentsu,
        };
        break;
      }
    }

    if (!item) return undefined;
    items.push(item);
  }

  // 2. コンテキスト生成
  const bakaze = KAZEHAI[Math.floor(Math.random() * 4)];
  const jikaze = KAZEHAI[Math.floor(Math.random() * 4)];

  // 3. 雀頭を生成
  let head: TehaiFuItem | undefined;
  for (let retry = 0; retry < 50; retry++) {
    const t = Math.floor(Math.random() * 34);
    if (!isHaiKindId(t)) continue;
    if (tracker.canUse(t, 2)) {
      tracker.use(t, 2);
      const res = calculateJantouFu(t, bakaze, jikaze);
      head = {
        id: crypto.randomUUID(),
        tiles: [t, t],
        type: "Pair",
        fu: res.fu,
        explanation: res.explanation,
        isOpen: false,
      };
      break;
    }
  }

  if (!head) return undefined;
  items.push(head);

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

  // 和了牌を手牌から選択
  const allTiles = items.flatMap((i) => [...i.tiles]);
  const agariHai = allTiles[Math.floor(Math.random() * allTiles.length)];

  const tehai = { closed, exposed };
  const result = validateTehai14(tehai);
  if (result.isErr()) return undefined;

  return {
    id: crypto.randomUUID(),
    tehai: result.value,
    context: { bakaze, jikaze, agariHai, isTsumo: Math.random() < 0.5 },
    items,
  };
}
