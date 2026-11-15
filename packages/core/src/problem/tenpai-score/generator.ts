import { err, ok, type Result } from "neverthrow";
import {
  calculateShanten,
  getUkeire,
  isMenzen,
  type HaiKindId,
  type Kazehai,
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
import type {
  TenpaiScoreGeneratorOptions,
  TenpaiScoreQuestion,
  TenpaiScoreWait,
} from "./types";

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
 * 待ち牌 1 つのツモ・ロンの点数計算問題
 * 待ち採点結果
 */
interface ScoredWait {
  readonly agariHai: HaiKindId;
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

/**
 * 聴牌形の点数計算問題を組み立てられない理由
 * 聴牌形問題構築エラー
 *
 * どれも出題設定（点数帯など）に依らない、聴牌形の点数計算として成り立たない形:
 * - `notTenpai`: シャンテン数が 0 でない（面子手として聴牌していない）
 * - `tooFewWaits`: 待ちが 1 つだけ（和了形の点数計算と同じ問題になる）
 * - `invalidWait`: 待ち牌を足した和了形が手牌として成り立たない
 * - `riichiWithFuro`: 門前でない聴牌形にリーチが渡された
 * - `karaWait`: 表示牌に取られて 4 枚目が無い待ち（純カラ）がある
 * - `noYakuTsumo`: ツモでも役が付かない待ちがある（副露手の役なし）
 * - `unsupportedYakuman`: いずれかの待ち・和了方法が役満 3 個分以上
 * - `riichiWithNoYakuRon`: 役なしのロン待ちがあるのにリーチしている
 * - `fuOutOfOptions`: 回答の符選択肢に無い符（110 符超）になる和了方法がある
 */
export type TenpaiScoreQuestionBuildError =
  | "notTenpai"
  | "tooFewWaits"
  | "invalidWait"
  | "riichiWithFuro"
  | "karaWait"
  | "noYakuTsumo"
  | "unsupportedYakuman"
  | "riichiWithNoYakuRon"
  | "fuOutOfOptions";

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
 * 聴牌形を確かめ、待ち牌を列挙して待ちごとの和了形を作る
 * 聴牌形解析
 *
 * 生成器が選んだ和了牌以外の待ちも拾う。待ちが {@link MIN_WAIT_COUNT} に
 * 届かない形は出題しない。
 */
function analyzeTenpaiShape(
  tehai: Tehai13,
): Result<TenpaiShape, "notTenpai" | "tooFewWaits" | "invalidWait"> {
  const shanten = calculateShanten(tehai, false, false);
  if (shanten.isErr() || shanten.value !== 0) return err("notTenpai");

  const waitHais = getUkeire(tehai);
  if (waitHais.length < MIN_WAIT_COUNT) return err("tooFewWaits");
  const waits: WaitShape[] = [];
  for (const agariHai of waitHais) {
    const agariTehai = toAgariTehai(tehai, agariHai);
    if (!agariTehai) return err("invalidWait");
    waits.push({ agariHai, agariTehai });
  }
  return ok({ tehai, waits, menzen: isMenzen(waits[0].agariTehai) });
}

/**
 * 1. 和了形を作って和了牌を抜き、聴牌形にする。2. 待ち牌を列挙する
 * 聴牌形抽選
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
  const shape = analyzeTenpaiShape(tehai);
  return shape.isOk() ? shape.value : undefined;
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

/** 聴牌形の局面のうち、採点に要るもの（風と表ドラ表示牌） */
interface TenpaiSituation {
  readonly jikaze: Kazehai;
  readonly bakaze: Kazehai;
  readonly doraMarkers: readonly HaiKindId[];
}

/** 聴牌形に決めた局面 */
interface TenpaiScene extends TenpaiSituation {
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
 * 待ちごとにツモ・ロンを採点する
 * 待ち採点
 *
 * ツモでも和了れない待ち（副露手の役なし）とトリプル役満以上は組み立てない。
 * ロンの役なしは `ron` を undefined にして残す。
 */
function scoreWaits(
  shape: TenpaiShape,
  situation: TenpaiSituation,
  ruleConfig: RuleConfig,
  riichi: RiichiInput | undefined,
): Result<readonly ScoredWait[], "noYakuTsumo" | "unsupportedYakuman"> {
  const score = (wait: WaitShape, isTsumo: boolean) =>
    buildScoreQuestion({
      tehai: wait.agariTehai,
      agariHai: wait.agariHai,
      isTsumo,
      jikaze: situation.jikaze,
      bakaze: situation.bakaze,
      doraMarkers: situation.doraMarkers,
      ruleConfig,
      riichi,
    });
  const scored: ScoredWait[] = [];
  for (const wait of shape.waits) {
    const tsumo = score(wait, true);
    if (tsumo.isErr()) {
      return err(tsumo.error === "noYaku" ? "noYakuTsumo" : tsumo.error);
    }
    const ron = score(wait, false);
    if (ron.isErr() && ron.error !== "noYaku") return err(ron.error);
    scored.push({
      agariHai: wait.agariHai,
      tsumo: tsumo.value,
      ron: ron.isOk() ? ron.value : undefined,
    });
  }
  return ok(scored);
}

/**
 * リーチと役なしのロン待ちが重なったときの扱い
 * リーチ取り下げ方針
 *
 * - `withdrawRiichi`: リーチを取り下げて組み立てる（生成器。リーチは抽選で
 *   立てたいだけなので、立てられなければ立てない）
 * - `reject`: 組み立てない（盤面を渡された構築。リーチは盤面の一部で、
 *   黙って外すと別の問題になる）
 */
type NoYakuRonRiichiPolicy = "withdrawRiichi" | "reject";

/**
 * すべての待ち・和了方法の符が回答の符選択肢にあるか
 * 符選択肢判定
 */
function hasAnswerableFu(waits: readonly ScoredWait[]): boolean {
  return waits.every((wait) =>
    [wait.tsumo, wait.ron].every(
      (question) => question === undefined || isFu(question.answer.fu),
    ),
  );
}

/**
 * 4. 待ちごとにツモ・ロンを採点し、聴牌形の点数計算問題にまとめる
 * 聴牌形問題組み立て
 *
 * まずリーチ無しで採点し、役なしのロン待ちがあるかを見る。リーチは
 * ライブラリの概念ではなく役の後付けで表現しており、役なしの和了形からは
 * 符の内訳が得られない（`calculateScoreForTehai` が Err で返す）ため
 * 「立直のみ」の答えを組み立てられない。役なしのロン待ちとリーチが重なったら
 * `policy` に従う（{@link NoYakuRonRiichiPolicy}）。
 */
function scoreTenpaiShape(
  shape: TenpaiShape,
  situation: TenpaiSituation,
  ruleConfig: RuleConfig,
  riichi: RiichiInput | undefined,
  policy: NoYakuRonRiichiPolicy,
): Result<TenpaiScoreQuestion, TenpaiScoreQuestionBuildError> {
  const withoutRiichi = scoreWaits(shape, situation, ruleConfig, undefined);
  if (withoutRiichi.isErr()) return err(withoutRiichi.error);
  const hasNoYakuRon = withoutRiichi.value.some(
    (wait) => wait.ron === undefined,
  );
  if (riichi && hasNoYakuRon && policy === "reject") {
    return err("riichiWithNoYakuRon");
  }
  const appliedRiichi = hasNoYakuRon ? undefined : riichi;
  let scoredWaits = withoutRiichi.value;
  if (appliedRiichi) {
    const withRiichi = scoreWaits(shape, situation, ruleConfig, appliedRiichi);
    if (withRiichi.isErr()) return err(withRiichi.error);
    scoredWaits = withRiichi.value;
  }
  if (!hasAnswerableFu(scoredWaits)) return err("fuOutOfOptions");

  return ok({
    tehai: shape.tehai,
    jikaze: situation.jikaze,
    bakaze: situation.bakaze,
    doraMarkers: situation.doraMarkers,
    isRiichi: appliedRiichi !== undefined,
    uraDoraMarkers: appliedRiichi?.uraDoraMarkers,
    waits: scoredWaits,
  });
}

/**
 * 聴牌形 1 つと局面から聴牌形の点数計算問題を組み立てる入力
 * 聴牌形問題構築入力
 */
export interface TenpaiScoreQuestionBuildInput extends TenpaiSituation {
  /** 聴牌形（純手牌 13 枚相当 + 副露）。理牌済みであること */
  readonly tehai: Tehai13;
  /** リーチしていれば渡す。門前でない聴牌形に渡すと `riichiWithFuro` */
  readonly riichi?: RiichiInput;
  readonly ruleConfig: RuleConfig;
}

/**
 * 聴牌形 1 つと局面から聴牌形の点数計算の問題を組み立てる（乱数を使わない）
 * 聴牌形問題構築
 *
 * 手牌・局面の抽選と出題設定の絞り込み（点数帯）は持たない。生成器
 * （{@link generateTenpaiScoreQuestion}）と同じ解析・採点の経路を通るため、
 * 生成した問題の盤面とルールを渡せば同じ問題が返る。保存した盤面を
 * 組み立て直す用途で使う。
 *
 * 組み立てられない条件は生成器が出題しない聴牌形と同じ
 * （{@link TenpaiScoreQuestionBuildError}）。ただし純カラは渡された表示牌
 * （表と、リーチなら裏）だけで判定する。生成器はリーチを取り下げた盤面でも
 * 引いた裏ドラ表示牌まで見て判定するので、ここはそれより緩くなるだけで、
 * 生成器が出した盤面を拒むことはない。リーチと役なしのロン待ちが重なる
 * 盤面は、リーチを外さずに拒む。
 */
export function buildTenpaiScoreQuestion(
  input: TenpaiScoreQuestionBuildInput,
): Result<TenpaiScoreQuestion, TenpaiScoreQuestionBuildError> {
  const shape = analyzeTenpaiShape(input.tehai);
  if (shape.isErr()) return err(shape.error);
  if (input.riichi && !shape.value.menzen) return err("riichiWithFuro");
  const visibleMarkers = [
    ...input.doraMarkers,
    ...(input.riichi?.uraDoraMarkers ?? []),
  ];
  const waitHais = shape.value.waits.map((wait) => wait.agariHai);
  if (hasKaraWait(input.tehai, waitHais, visibleMarkers)) {
    return err("karaWait");
  }
  return scoreTenpaiShape(
    shape.value,
    input,
    input.ruleConfig,
    input.riichi,
    "reject",
  );
}

/**
 * 5. すべての待ち・和了方法が点数帯と符の選択肢に収まるか
 * 出題条件判定
 */
export function fitsAnswerOptions(
  scoredWaits: readonly Pick<TenpaiScoreWait, "tsumo" | "ron">[],
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
 *
 * 抽選（手牌・局面）の後の解析と採点は {@link buildTenpaiScoreQuestion} と
 * 同じ関数を通る。保存した盤面を組み立て直したときに同じ問題になるため。
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

  const riichi: RiichiInput | undefined =
    scene.wantsRiichi && scene.uraDoraMarkers
      ? { uraDoraMarkers: scene.uraDoraMarkers }
      : undefined;
  const built = scoreTenpaiShape(
    shape,
    scene,
    ruleConfig,
    riichi,
    "withdrawRiichi",
  );
  if (built.isErr()) return undefined;
  if (!fitsAnswerOptions(built.value.waits, resolved.allowedRanges)) {
    return undefined;
  }
  return built.value;
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
