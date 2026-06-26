import {
  MentsuType,
  detectYaku,
  isMenzen,
  validateTehai14,
  type HaiKindId,
  type Kazehai,
  type CompletedMentsu,
  type Tehai14,
} from "@pai-forge/riichi-mahjong";
import type { YakuQuestion } from "./types";
import {
  YAKU_NAME_MAP,
  EXCLUDED_YAKU_FROM_ANSWER,
  getKazeYakuhaiDisplayName,
} from "./constants";
import { KAZEHAI } from "../../core/constants";
import { randomChoice } from "../../core/random";
import { HaiUsageTracker } from "../../core/hai-tracker";
import { generateDoraMarkers } from "../shared/dora-utils";
import { countHaiInTehai } from "../shared/hai-count";
import { countKantsu } from "../shared/count-kantsu";
import {
  generateMentsuSet,
  generatePairTile,
  pickAgariHai,
} from "../shared/hand-skeleton";

/**
 * 風牌の役牌を手動で判定し、表示名のリストを返す
 * ライブラリの detectYaku は風牌役牌を返さないため補完する
 * 風牌役牌判定
 */
function detectKazeYakuhai(
  tehai: Tehai14,
  bakaze: Kazehai,
  jikaze: Kazehai,
): string[] {
  const result: string[] = [];
  const kazesToCheck = new Set<Kazehai>([bakaze, jikaze]);

  for (const kaze of kazesToCheck) {
    const count = countHaiInTehai(tehai, kaze);
    if (count >= 3) {
      const displayName = getKazeYakuhaiDisplayName(kaze);
      if (displayName) {
        // 連風牌（場風と自風が同じ）の場合、Set により1回だけ追加される。
        // この練習は役「名」の選択のみを問うため、翻数（2翻分）は問わない。
        result.push(displayName);
      }
    }
  }

  return result;
}

/** 役練習用の面子生成重み（50%順子, 30%刻子, 20%槓子） */
const YAKU_MENTSU_WEIGHTS = { shuntsu: 0.5, koutsu: 0.3 } as const;

/**
 * 役選択練習の問題を生成する
 * ランダムな手牌を構築し、成立する役を正解として返す
 * 役選択問題ジェネレータ
 */
export function generateYakuQuestion(): YakuQuestion | undefined {
  const tracker = new HaiUsageTracker();

  // 1. 4面子を生成
  const mentsuList = generateMentsuSet(tracker, YAKU_MENTSU_WEIGHTS);
  if (!mentsuList) return undefined;

  // 2. コンテキスト生成
  const bakaze = randomChoice(KAZEHAI);
  const jikaze = randomChoice(KAZEHAI);

  // 3. 雀頭を生成
  const headTile = generatePairTile(tracker);
  if (headTile === undefined) return undefined;

  // 4. Tehai14 を構築
  const closed: HaiKindId[] = [headTile, headTile]; // 雀頭は常に閉じた手牌
  const exposed: CompletedMentsu[] = [];

  for (const { mentsu } of mentsuList) {
    if (!!mentsu.furo || mentsu.type === MentsuType.Kantsu) {
      exposed.push(mentsu);
    } else {
      closed.push(...mentsu.hais);
    }
  }

  closed.sort((a, b) => a - b);

  const agariHai = pickAgariHai(mentsuList, headTile);

  const tehai = { closed, exposed };
  const validateResult = validateTehai14(tehai);
  if (validateResult.isErr()) return undefined;

  const validTehai = validateResult.value;
  const menzen = isMenzen(validTehai);
  const isTsumo = Math.random() < 0.5;
  const isRiichi = menzen && Math.random() < 0.2;

  const kantsuCount = countKantsu(validTehai);
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
    const kazeYakuhai = detectKazeYakuhai(validTehai, bakaze, jikaze);
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
