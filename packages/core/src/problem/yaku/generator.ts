import {
  detectYaku,
  isMenzen,
  type Kazehai,
  type Tehai14,
} from "@pai-forge/riichi-mahjong";
import type { YakuQuestion } from "./types";
import {
  YAKU_NAME_MAP,
  EXCLUDED_YAKU_FROM_ANSWER,
  getKazeYakuhaiDisplayName,
} from "./constants";
import { BAKAZE_OPTIONS, KAZEHAI } from "../../core/constants";
import { defaultIdGenerator, type IdGenerator } from "../../core/id";
import {
  randomBool,
  randomChoice,
  defaultRandomSource,
  type RandomSource,
} from "../../core/random";
import { HaiUsageTracker } from "../../core/hai-tracker";
import { generateDoraMarkers } from "../shared/dora-utils";
import { countHaiInTehai } from "../../core/hai-count";
import { countKantsu } from "../shared/count-kantsu";
import {
  buildTehai14,
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
 *
 * @param idGen - 問題 ID の採番（既定 crypto.randomUUID）
 * @param rng - 乱数供給源（既定 Math.random）
 */
export function generateYakuQuestion(
  idGen: IdGenerator = defaultIdGenerator,
  rng: RandomSource = defaultRandomSource,
): YakuQuestion | undefined {
  const tracker = new HaiUsageTracker();

  // 1. 4面子を生成
  const mentsuList = generateMentsuSet(tracker, YAKU_MENTSU_WEIGHTS, 4, rng);
  if (!mentsuList) return undefined;

  // 2. コンテキスト生成
  const bakaze = randomChoice(BAKAZE_OPTIONS, rng);
  const jikaze = randomChoice(KAZEHAI, rng);

  // 3. 雀頭を生成
  const headTile = generatePairTile(tracker, rng);
  if (headTile === undefined) return undefined;

  // 4. Tehai14 を構築
  const validTehai = buildTehai14(mentsuList, headTile);
  if (validTehai === undefined) return undefined;

  const agariHai = pickAgariHai(mentsuList, headTile, rng);
  const menzen = isMenzen(validTehai);
  const isTsumo = randomBool(0.5, rng);
  const isRiichi = menzen && randomBool(0.2, rng);

  const kantsuCount = countKantsu(validTehai);
  const doraMarkers = generateDoraMarkers(kantsuCount, rng);
  // 裏ドラは立直の手だけがめくる。役の正解には効かないが、リーチ棒と表ドラだけ
  // 出して裏ドラが無い盤面は実戦にない見え方になるため出題データに持たせる。
  const uraDoraMarkers = isRiichi
    ? generateDoraMarkers(kantsuCount, rng)
    : undefined;

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
      id: idGen(),
      tehai: validTehai,
      context: {
        bakaze,
        jikaze,
        agariHai,
        isTsumo,
        isRiichi,
        doraMarkers,
        uraDoraMarkers,
      },
      correctYakuNames: yakuNames,
    };
  } catch {
    // ライブラリ（detectYaku）はエッジケースの手牌で例外を投げることがあるため、
    // 広範な catch で捕捉し、リトライに委ねる
    return undefined;
  }
}
