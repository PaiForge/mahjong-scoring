import {
  HaiKind,
  MentsuType,
  validateTehai14,
  type HaiKindId,
  type Kazehai,
  type CompletedMentsu,
} from "@pai-forge/riichi-mahjong";
import type { TehaiFuQuestion, TehaiFuItem } from "./types";
import {
  createRandomShuntsu,
  createRandomKoutsu,
  createRandomKantsu,
} from "../mentsu-fu/mentsu-factory";
import { KAZEHAI } from "../../core/constants";
import { isHaiKindId } from "../../core/type-guards";

/**
 * 雀頭の符を計算する
 * 雀頭符計算
 */
function calculateHeadFu(
  tile: HaiKindId,
  bakaze: Kazehai,
  jikaze: Kazehai,
): { fu: number; explanation: string } {
  if (tile >= HaiKind.Haku && tile <= HaiKind.Chun) {
    return { fu: 2, explanation: "役牌雀頭（三元牌）" };
  }

  const reasons: string[] = [];
  if (tile === bakaze) reasons.push("場風");
  if (tile === jikaze) reasons.push("自風");

  if (reasons.length > 0) {
    return { fu: 2, explanation: `役牌雀頭（${reasons.join("・")}）` };
  }

  return { fu: 0, explanation: "数牌またはオタ風の雀頭" };
}

/**
 * ランダムな面子を生成する（重み付き: 20%順子, 50%刻子, 30%槓子）
 * 面子ランダム生成
 */
function createRandomMentsu() {
  const r = Math.random();
  if (r < 0.2) {
    return createRandomShuntsu() ?? createRandomKoutsu();
  }
  if (r < 0.7) {
    return createRandomKoutsu();
  }
  return createRandomKantsu();
}

/**
 * 手牌の符計算問題を生成する
 * 手牌符問題ジェネレータ
 */
export function generateTehaiFuQuestion(): TehaiFuQuestion | undefined {
  const tracker = new Map<number, number>();
  const canUse = (t: HaiKindId, count: number) =>
    (tracker.get(t) ?? 0) + count <= 4;
  const use = (t: HaiKindId, count: number) =>
    tracker.set(t, (tracker.get(t) ?? 0) + count);

  const items: TehaiFuItem[] = [];

  // 1. 4面子を生成
  for (let i = 0; i < 4; i++) {
    let item: TehaiFuItem | undefined;

    for (let retry = 0; retry < 50; retry++) {
      const result = createRandomMentsu();
      const tiles = result.mentsu.hais;

      // 牌の使用可能性チェック
      const tempCount = new Map<HaiKindId, number>();
      for (const t of tiles)
        tempCount.set(t, (tempCount.get(t) ?? 0) + 1);

      let possible = true;
      for (const [t, c] of tempCount.entries()) {
        if (!canUse(t, c)) {
          possible = false;
          break;
        }
      }

      if (possible) {
        for (const t of tiles) use(t, 1);
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
    if (canUse(t, 2)) {
      use(t, 2);
      const res = calculateHeadFu(t, bakaze, jikaze);
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
