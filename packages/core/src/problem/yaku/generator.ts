import { detectYaku, isMenzen, type Kazehai } from "@pai-forge/riichi-mahjong";
import type { YakuQuestion } from "./types";
import {
  YAKU_NAME_MAP,
  EXCLUDED_YAKU_FROM_ANSWER,
  getKazeYakuhaiDisplayName,
} from "./constants";
import { BAKAZE_OPTIONS, KAZEHAI } from "../../core/constants";
import { hasYakumanYaku } from "../../core/yaku-names";
import { defaultIdGenerator, type IdGenerator } from "../../core/id";
import {
  randomBool,
  randomChoice,
  defaultRandomSource,
  type RandomSource,
} from "../../core/random";
import { HaiUsageTracker } from "../../core/hai-tracker";
import { generateDoraMarkers } from "../shared/dora-utils";
import {
  buildTehai14,
  generateMentsuSet,
  generatePairTile,
  pickAgariHai,
} from "../shared/hand-skeleton";

/** 役練習用の面子生成重み（50%順子, 30%刻子, 20%槓子） */
const YAKU_MENTSU_WEIGHTS = { shuntsu: 0.5, koutsu: 0.3 } as const;

/**
 * ライブラリが返した役を、回答の選択肢と同じ日本語の役名に直す
 * 役名の回答語彙化
 *
 * - 場風・自風はライブラリが "Bakaze" / "Jikaze" で返す。この練習は
 *   「役牌 東」のように風ごとの選択肢で答えさせるため、局面の風に引き直す。
 *   連風牌（場風＝自風）は両方が同じ表示名になるので 1 つにまとめる
 *   （役「名」の選択のみを問い、翻数は問わない）
 * - 選択肢に無い役（{@link EXCLUDED_YAKU_FROM_ANSWER}）は落とす
 * - 立直はライブラリが判定しないので後付けする。役満は通常役と複合しないので、
 *   役満の手には足さない。リーチ棒は盤面に出たまま（isRiichi は宣言の有無）で
 *   正解にだけ乗らない — 「役満にリーチは複合しない」と答えさせる出題になる
 *
 * @param yakuResult - `detectYaku` の結果（役名と翻数の組）
 */
export function toYakuAnswerNames(
  yakuResult: readonly (readonly [string, number])[],
  context: {
    readonly bakaze: Kazehai;
    readonly jikaze: Kazehai;
    readonly isRiichi: boolean;
  },
): string[] {
  const names: string[] = [];
  for (const [yakuName] of yakuResult) {
    if (EXCLUDED_YAKU_FROM_ANSWER.has(yakuName)) continue;
    const jaName =
      yakuName === "Bakaze"
        ? getKazeYakuhaiDisplayName(context.bakaze)
        : yakuName === "Jikaze"
          ? getKazeYakuhaiDisplayName(context.jikaze)
          : YAKU_NAME_MAP[yakuName];
    if (jaName && !names.includes(jaName)) names.push(jaName);
  }
  if (context.isRiichi && !hasYakumanYaku(yakuResult)) names.push("立直");
  return names;
}

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

  // 裏ドラは立直の手だけがめくる。役の正解には効かないが、リーチ棒と表ドラだけ
  // 出して裏ドラが無い盤面は実戦にない見え方になるため出題データに持たせる。
  const markers = generateDoraMarkers(validTehai, isRiichi, rng);
  if (!markers) return undefined;
  const { doraMarkers, uraDoraMarkers } = markers;

  // detectYaku で手牌役を取得
  const yakuResult = detectYaku(validTehai, {
    agariHai,
    bakaze,
    jikaze,
    doraMarkers: [],
    isTsumo,
  });

  const yakuNames = toYakuAnswerNames(yakuResult, {
    bakaze,
    jikaze,
    isRiichi,
  });
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
}
