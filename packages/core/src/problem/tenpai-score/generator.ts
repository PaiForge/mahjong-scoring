import {
  calculateShanten,
  getUkeire,
  isMenzen,
  type HaiKindId,
  type RuleConfig,
  type Tehai13,
  type Tehai14,
} from "@pai-forge/riichi-mahjong";
import { countHaiInTehai } from "../../core/hai-count";
import {
  defaultRandomSource,
  randomBool,
  type RandomSource,
} from "../../core/random";
import { doubleWindJantouFu } from "../../rules/settings";
import { isFu } from "../../score/constants";
import { retryGenerate } from "../retry-generate";
import {
  buildScoreQuestion,
  isScoreLevelAllowed,
  type RiichiInput,
} from "../score/build-question";
import { generateMentsuTehai } from "../score/strategies/mentsu-strategy";
import type { ScoreQuestion, ScoreRange } from "../score/types";
import { generateDoraMarkers } from "../shared/dora-utils";
import { finalizeTehai13, finalizeTehai14 } from "../shared/hand-skeleton";
import { selectBakaze, selectJikaze } from "../shared/kaze-select";
import type { TenpaiScoreGeneratorOptions, TenpaiScoreQuestion } from "./types";

/** 出題に必要な待ちの数。1 面待ちは和了形の点数計算と同じ問題になる */
const MIN_WAIT_COUNT = 2;

/**
 * 和了形から和了牌を 1 枚抜いて聴牌形にする
 * 聴牌形化
 *
 * 面子手の生成器（`generateMentsuTehai`）は和了牌を純手牌の中に含めて返す
 * ため、その 1 枚を抜けば必ず聴牌形になる。抜く牌を和了牌に固定するのは、
 * 生成器が既に「面子か雀頭を完成させる牌」として選んでいるため。
 */
function toTenpaiTehai(
  tehai: Tehai14,
  agariHai: HaiKindId,
): Tehai13 | undefined {
  const index = tehai.closed.indexOf(agariHai);
  if (index < 0) return undefined;
  return finalizeTehai13(
    [...tehai.closed.slice(0, index), ...tehai.closed.slice(index + 1)],
    tehai.exposed,
  );
}

/**
 * 聴牌形に待ち牌を 1 枚足して和了形にする
 * 和了形化
 */
function toAgariTehai(
  tehai: Tehai13,
  agariHai: HaiKindId,
): Tehai14 | undefined {
  return finalizeTehai14([...tehai.closed, agariHai], tehai.exposed);
}

/**
 * 待ち牌 1 つのツモ・ロンの点数計算問題（リーチ適用前）
 * 待ち採点結果
 */
interface ScoredWait {
  readonly agariHai: HaiKindId;
  readonly agariTehai: Tehai14;
  readonly tsumo: ScoreQuestion;
  readonly ron: ScoreQuestion | undefined;
}

/** 既定値を埋めた出題条件（各項目の意味は {@link TenpaiScoreGeneratorOptions}） */
interface ResolvedOptions {
  readonly includeFuro: boolean;
  readonly includeParent: boolean;
  readonly includeChild: boolean;
  readonly renfonpaiAs4Fu: boolean;
  readonly kiriageMangan: boolean;
  readonly yakumanRules: TenpaiScoreGeneratorOptions["yakumanRules"];
  readonly allowedRanges: readonly ScoreRange[];
  readonly rng: RandomSource;
}

function resolveOptions(options: TenpaiScoreGeneratorOptions): ResolvedOptions {
  return {
    includeFuro: options.includeFuro ?? true,
    includeParent: options.includeParent ?? true,
    includeChild: options.includeChild ?? true,
    renfonpaiAs4Fu: options.renfonpaiAs4Fu ?? false,
    kiriageMangan: options.kiriageMangan ?? false,
    yakumanRules: options.yakumanRules,
    allowedRanges: options.allowedRanges ?? ["nonMangan", "manganPlus"],
    rng: options.rng ?? defaultRandomSource,
  };
}

/** 待ち牌 1 つと、それを足した和了形 */
interface WaitShape {
  readonly agariHai: HaiKindId;
  readonly agariTehai: Tehai14;
}

/** 聴牌形と、その待ちごとの和了形 */
interface TenpaiShape {
  readonly tehai: Tehai13;
  readonly waits: readonly WaitShape[];
  /** 門前かどうかは待ちによらない（副露は聴牌形が持つ） */
  readonly menzen: boolean;
}

/**
 * 1. 和了形を作って和了牌を抜き、聴牌形にする。2. 待ち牌を列挙する
 * 聴牌形抽選
 *
 * 生成器が選んだ和了牌以外の待ちも拾う。待ちが {@link MIN_WAIT_COUNT} に
 * 届かない形は出題しない。
 */
function drawTenpaiShape(
  includeFuro: boolean,
  rng: RandomSource,
): TenpaiShape | undefined {
  const generated = generateMentsuTehai(includeFuro, rng);
  if (!generated) return undefined;
  const tehai = toTenpaiTehai(generated.tehai, generated.agariHai);
  if (!tehai) return undefined;
  // 和了牌を抜いた形は聴牌のはずだが、前提が崩れたら黙って出題しない
  const shanten = calculateShanten(tehai, false, false);
  if (shanten.isErr() || shanten.value !== 0) return undefined;

  const waitHais = getUkeire(tehai);
  if (waitHais.length < MIN_WAIT_COUNT) return undefined;
  const waits: WaitShape[] = [];
  for (const agariHai of waitHais) {
    const agariTehai = toAgariTehai(tehai, agariHai);
    if (!agariTehai) return undefined;
    waits.push({ agariHai, agariTehai });
  }
  return { tehai, waits, menzen: isMenzen(waits[0].agariTehai) };
}

/**
 * 表示牌に取られて 4 枚目が無い待ち（純カラ）を持つか
 * 純カラ判定
 *
 * 待ち牌は手牌の外にあるので、手牌の中の枚数と表示牌（表・裏）に出ている
 * 枚数の合計が 4 なら、その待ちでは和了れない。
 */
export function hasKaraWait(
  tehai: Tehai13,
  waitHais: readonly HaiKindId[],
  visibleMarkers: readonly HaiKindId[],
): boolean {
  return waitHais.some(
    (hai) =>
      countHaiInTehai(tehai, hai) +
        visibleMarkers.filter((marker) => marker === hai).length >=
      4,
  );
}

/** 聴牌形に決めた局面 */
interface TenpaiScene {
  readonly jikaze: TenpaiScoreQuestion["jikaze"];
  readonly bakaze: TenpaiScoreQuestion["bakaze"];
  readonly doraMarkers: readonly HaiKindId[];
  readonly uraDoraMarkers: readonly HaiKindId[] | undefined;
  /** リーチを立てたい（門前の 20%）。役なしのロン待ちがあれば立てない */
  readonly wantsRiichi: boolean;
}

/**
 * 3. 局面の決定。ドラ表示牌は聴牌形から引く（待ち牌は手牌の外）
 * 局面抽選
 */
function drawTenpaiScene(
  shape: TenpaiShape,
  options: ResolvedOptions,
): TenpaiScene | undefined {
  const { includeParent, includeChild, rng } = options;
  const jikaze = selectJikaze(includeParent, includeChild, rng);
  const bakaze = selectBakaze(jikaze, false, rng);
  const wantsRiichi = shape.menzen && randomBool(0.2, rng);
  const markers = generateDoraMarkers(shape.tehai, wantsRiichi, rng);
  if (!markers) return undefined;
  const { doraMarkers, uraDoraMarkers } = markers;
  const visibleMarkers = [...doraMarkers, ...(uraDoraMarkers ?? [])];
  const waitHais = shape.waits.map((wait) => wait.agariHai);
  if (hasKaraWait(shape.tehai, waitHais, visibleMarkers)) return undefined;
  return { jikaze, bakaze, doraMarkers, uraDoraMarkers, wantsRiichi };
}

/**
 * 4. 待ちごとにツモ・ロンを採点する
 * 待ち採点
 *
 * ツモでも和了れない待ち（副露手の役なし）とトリプル役満以上は出題しない。
 * ロンの役なしは `ron` を undefined にして残す。
 */
function scoreWaits(
  shape: TenpaiShape,
  scene: TenpaiScene,
  ruleConfig: RuleConfig,
  riichi: RiichiInput | undefined,
): readonly ScoredWait[] | undefined {
  const score = (wait: WaitShape, isTsumo: boolean) =>
    buildScoreQuestion({
      tehai: wait.agariTehai,
      agariHai: wait.agariHai,
      isTsumo,
      jikaze: scene.jikaze,
      bakaze: scene.bakaze,
      doraMarkers: scene.doraMarkers,
      ruleConfig,
      riichi,
    });
  const scored: ScoredWait[] = [];
  for (const wait of shape.waits) {
    const tsumo = score(wait, true);
    if (tsumo.isErr()) return undefined;
    const ron = score(wait, false);
    if (ron.isErr() && ron.error !== "noYaku") return undefined;
    scored.push({
      agariHai: wait.agariHai,
      agariTehai: wait.agariTehai,
      tsumo: tsumo.value,
      ron: ron.isOk() ? ron.value : undefined,
    });
  }
  return scored;
}

/**
 * 5. すべての待ち・和了方法が点数帯と符の選択肢に収まるか
 * 出題条件判定
 */
export function fitsAnswerOptions(
  scoredWaits: readonly ScoredWait[],
  allowedRanges: readonly ScoreRange[],
): boolean {
  return scoredWaits.every((wait) =>
    [wait.tsumo, wait.ron].every(
      (question) =>
        question === undefined ||
        (isScoreLevelAllowed(question.answer.scoreLevel, allowedRanges) &&
          isFu(question.answer.fu)),
    ),
  );
}

/**
 * 聴牌形の点数計算の問題を 1 つ生成する（生成不可能な場合は undefined を返す）
 * 聴牌形の点数計算問題生成
 *
 * 和了形の点数計算と同じ面子手の生成器で和了形を作り、和了牌を抜いて
 * 聴牌形にしてから待ち牌を列挙し直す。生成器が選んだ和了牌以外にも
 * 待ちがある形（両面・三面・双碰・変則）だけを出題し、待ちごとに
 * ツモ・ロンの点数計算問題を組み立てる。
 *
 * 出題しない聴牌形:
 * - 待ちが 1 つだけ（和了形の点数計算と同じ問題になる）
 * - ツモでも役が付かない待ちを持つ副露手（その待ちでは和了れず、
 *   「待ち牌」として答えさせる意味が無い）。門前のロン役なしは出題する。
 *   その待ちのロンは「役なし」が正解で、待ち牌の理解を問う意義があるため
 * - 待ち牌が表示牌に取られて 4 枚とも見えている形（純カラの待ち。待ちの
 *   形としては待ちだが和了れないため、答えを 1 つに定められない）
 * - いずれかの待ち・和了方法で点数帯（`allowedRanges`）を外れる形、または
 *   回答の符選択肢に無い符（110 符超）になる形
 *
 * 面子手のみ。七対子・国士無双は待ちの列挙（`getUkeire`）が面子手しか
 * 見ないため出題しない（画面側で但し書きを出す）。
 *
 * リーチは門前のとき 20% で立てる。ただし役なしのロン待ちを持つ聴牌形では
 * 立てない。リーチはライブラリの概念ではなく役の後付けで表現しており、
 * 役なしの和了形からは符の内訳が得られない（`calculateScoreForTehai` が
 * Err で返す）ため「立直のみ」の答えを組み立てられない。和了形の点数計算も同じ理由で
 * 立直のみの手を出さない
 */
export function generateTenpaiScoreQuestion(
  options: TenpaiScoreGeneratorOptions = {},
): TenpaiScoreQuestion | undefined {
  const resolved = resolveOptions(options);
  const shape = drawTenpaiShape(resolved.includeFuro, resolved.rng);
  if (!shape) return undefined;
  const scene = drawTenpaiScene(shape, resolved);
  if (!scene) return undefined;

  const ruleConfig: RuleConfig = {
    doubleWindJantouFu: doubleWindJantouFu(resolved.renfonpaiAs4Fu),
    kiriageMangan: resolved.kiriageMangan,
    ...resolved.yakumanRules,
  };

  // まずリーチ無しで採点し、役なしのロン待ちがあるかを見る（上記の理由で
  // リーチと両立しない）
  const withoutRiichi = scoreWaits(shape, scene, ruleConfig, undefined);
  if (!withoutRiichi) return undefined;
  const hasNoYakuRon = withoutRiichi.some((wait) => wait.ron === undefined);
  const riichi: RiichiInput | undefined =
    scene.wantsRiichi && scene.uraDoraMarkers && !hasNoYakuRon
      ? { uraDoraMarkers: scene.uraDoraMarkers }
      : undefined;
  const scoredWaits = riichi
    ? scoreWaits(shape, scene, ruleConfig, riichi)
    : withoutRiichi;
  if (!scoredWaits) return undefined;
  if (!fitsAnswerOptions(scoredWaits, resolved.allowedRanges)) return undefined;

  return {
    tehai: shape.tehai,
    jikaze: scene.jikaze,
    bakaze: scene.bakaze,
    doraMarkers: scene.doraMarkers,
    isRiichi: riichi !== undefined,
    uraDoraMarkers: riichi?.uraDoraMarkers,
    waits: scoredWaits.map(({ agariHai, tsumo, ron }) => ({
      agariHai,
      tsumo,
      ron,
    })),
  };
}

/**
 * 有効な問題が生成されるまでリトライするヘルパー
 * 有効問題生成
 *
 * 和了牌を抜いた形の多く（両面でない待ち）は 1 面待ちで捨てられるため、
 * 和了形の点数計算より試行回数を要する。
 *
 * @param options - 問題生成オプション
 * @param maxRetries - 最大リトライ回数
 */
export function generateValidTenpaiScoreQuestion(
  options: TenpaiScoreGeneratorOptions = {},
  maxRetries: number = 200,
): TenpaiScoreQuestion | undefined {
  return retryGenerate(() => generateTenpaiScoreQuestion(options), maxRetries);
}
