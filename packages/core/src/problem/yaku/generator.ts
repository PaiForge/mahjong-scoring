import {
  HaiKind,
  MentsuType,
  detectYaku,
  isMenzen,
  validateTehai14,
  type HaiKindId,
  type Kazehai,
  type CompletedMentsu,
} from "@pai-forge/riichi-mahjong";
import type { YakuQuestion } from "./types";
import {
  YAKU_NAME_MAP,
  EXCLUDED_YAKU_FROM_ANSWER,
  getKazeYakuhaiDisplayName,
} from "./constants";
import {
  createRandomShuntsu,
  createRandomKoutsu,
  createRandomKantsu,
} from "../mentsu-fu/mentsu-factory";
import { KAZEHAI } from "../../core/constants";
import { randomChoice } from "../../core/random";
import { isHaiKindId } from "../../core/type-guards";

/**
 * ドラ表示牌をランダムに生成する
 * ドラ表示牌生成
 */
function generateDoraMarkers(kantsuCount: number): HaiKindId[] {
  const count = 1 + kantsuCount;
  const markers: HaiKindId[] = [];
  for (let i = 0; i < count; i++) {
    const kindId = Math.floor(Math.random() * 34);
    if (isHaiKindId(kindId)) {
      markers.push(kindId);
    }
  }
  return markers;
}

/**
 * 手牌中の指定牌種の枚数をカウントする
 * 牌枚数カウント
 */
function countHaiInTehai(
  closed: readonly HaiKindId[],
  exposed: readonly CompletedMentsu[],
  haiKindId: HaiKindId,
): number {
  let count = 0;
  for (const h of closed) {
    if (h === haiKindId) count++;
  }
  for (const mentsu of exposed) {
    for (const h of mentsu.hais) {
      if (h === haiKindId) count++;
    }
  }
  return count;
}

/**
 * 風牌の役牌を手動で判定し、表示名のリストを返す
 * ライブラリの detectYaku は風牌役牌を返さないため補完する
 * 風牌役牌判定
 */
function detectKazeYakuhai(
  closed: readonly HaiKindId[],
  exposed: readonly CompletedMentsu[],
  bakaze: Kazehai,
  jikaze: Kazehai,
): string[] {
  const result: string[] = [];
  const kazesToCheck = new Set<Kazehai>([bakaze, jikaze]);

  for (const kaze of kazesToCheck) {
    const count = countHaiInTehai(closed, exposed, kaze);
    if (count >= 3) {
      const displayName = getKazeYakuhaiDisplayName(kaze);
      if (displayName) {
        // 連風牌（場風と自風が同じ）の場合、Set により1回だけ追加される。
        // このドリルは役「名」の選択のみを問うため、翻数（2翻分）は問わない。
        result.push(displayName);
      }
    }
  }

  return result;
}

/**
 * ランダムな面子を生成する（重み付き: 50%順子, 30%刻子, 20%槓子）
 * 面子ランダム生成
 */
function createRandomMentsu() {
  const r = Math.random();
  if (r < 0.5) {
    return createRandomShuntsu() ?? createRandomKoutsu();
  }
  if (r < 0.8) {
    return createRandomKoutsu();
  }
  return createRandomKantsu();
}

/**
 * 役選択ドリルの問題を生成する
 * ランダムな手牌を構築し、成立する役を正解として返す
 * 役選択問題ジェネレータ
 */
export function generateYakuQuestion(): YakuQuestion | undefined {
  const tracker = new Map<number, number>();
  const canUse = (t: HaiKindId, count: number) =>
    (tracker.get(t) ?? 0) + count <= 4;
  const use = (t: HaiKindId, count: number) =>
    tracker.set(t, (tracker.get(t) ?? 0) + count);

  const mentsuList: Array<{
    tiles: readonly HaiKindId[];
    mentsu?: CompletedMentsu;
    isOpen: boolean;
  }> = [];

  // 1. 4面子を生成
  for (let i = 0; i < 4; i++) {
    let found = false;

    for (let retry = 0; retry < 50; retry++) {
      const result = createRandomMentsu();
      const tiles = result.mentsu.hais;

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
        mentsuList.push({
          tiles: [...tiles],
          mentsu: result.mentsu,
          isOpen: !!result.mentsu.furo,
        });
        found = true;
        break;
      }
    }

    if (!found) return undefined;
  }

  // 2. コンテキスト生成
  const bakaze = randomChoice(KAZEHAI);
  const jikaze = randomChoice(KAZEHAI);

  // 3. 雀頭を生成
  let headTile: HaiKindId | undefined;
  for (let retry = 0; retry < 50; retry++) {
    const t = Math.floor(Math.random() * 34);
    if (!isHaiKindId(t)) continue;
    if (canUse(t, 2)) {
      use(t, 2);
      headTile = t;
      break;
    }
  }

  if (headTile === undefined) return undefined;

  // 4. Tehai14 を構築
  const closed: HaiKindId[] = [];
  const exposed: CompletedMentsu[] = [];

  // 雀頭は常に閉じた手牌
  closed.push(headTile, headTile);

  for (const item of mentsuList) {
    if (
      (item.isOpen || (item.mentsu && item.mentsu.type === MentsuType.Kantsu)) &&
      item.mentsu
    ) {
      exposed.push(item.mentsu);
    } else {
      closed.push(...item.tiles);
    }
  }

  closed.sort((a, b) => a - b);

  // 和了牌を手牌から選択
  const allTiles = [headTile, headTile, ...mentsuList.flatMap((m) => [...m.tiles])];
  const agariHai = allTiles[Math.floor(Math.random() * allTiles.length)];

  const tehai = { closed, exposed };
  const validateResult = validateTehai14(tehai);
  if (validateResult.isErr()) return undefined;

  const validTehai = validateResult.value;
  const menzen = isMenzen(validTehai);
  const isTsumo = Math.random() < 0.5;
  const isRiichi = menzen && Math.random() < 0.2;

  const kantsuCount = exposed.filter(
    (m) => m.type === MentsuType.Kantsu,
  ).length;
  const doraMarkers = generateDoraMarkers(kantsuCount);

  try {
    // detectYaku で手牌役を取得
    const yakuResult = detectYaku(validTehai, {
      agariHai,
      bakaze,
      jikaze,
      doraMarkers: [],
      isTsumo,
    });

    const yakuNames: string[] = [];

    // ライブラリ返却の役名を日本語に変換
    for (const [yakuName] of yakuResult) {
      if (EXCLUDED_YAKU_FROM_ANSWER.has(yakuName)) continue;

      const jaName = YAKU_NAME_MAP[yakuName];
      if (jaName) {
        yakuNames.push(jaName);
      }
    }

    // 風牌の役牌を手動判定（ライブラリが返さないため）
    const kazeYakuhai = detectKazeYakuhai(closed, exposed, bakaze, jikaze);
    for (const name of kazeYakuhai) {
      if (!yakuNames.includes(name)) {
        yakuNames.push(name);
      }
    }

    // 立直の追加（ライブラリは立直を判定しない）
    if (isRiichi) {
      yakuNames.push("立直");
    }

    // 門前清自摸和はライブラリが返すはずだが念のため確認
    // （detectYaku に isTsumo を渡しているので返るはず）

    // 役がない場合はリトライ
    if (yakuNames.length === 0) return undefined;

    return {
      id: crypto.randomUUID(),
      tehai: validTehai,
      context: {
        bakaze,
        jikaze,
        agariHai,
        isTsumo,
        isRiichi,
        doraMarkers,
      },
      correctYakuNames: yakuNames,
    };
  } catch {
    // ライブラリ（detectYaku）はエッジケースの手牌で例外を投げることがあるため、
    // 広範な catch で捕捉し、リトライに委ねる
    return undefined;
  }
}
