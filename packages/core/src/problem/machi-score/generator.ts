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
import { defaultRandomSource, randomBool } from "../../core/random";
import { doubleWindJantouFu } from "../../rules/settings";
import { isFu } from "../../score/constants";
import { retryGenerate } from "../retry-generate";
import {
  buildScoreQuestion,
  isScoreLevelAllowed,
  type RiichiInput,
} from "../score/build-question";
import { generateMentsuTehai } from "../score/strategies/mentsu-strategy";
import type { ScoreQuestion } from "../score/types";
import { generateDoraMarkers } from "../shared/dora-utils";
import { finalizeTehai13, finalizeTehai14 } from "../shared/hand-skeleton";
import { selectBakaze, selectJikaze } from "../shared/kaze-select";
import type { MachiScoreGeneratorOptions, MachiScoreQuestion } from "./types";

/** 出題に必要な待ちの数。1 面待ちは点数計算総合演習と同じ問題になる */
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

/**
 * 待ち別点数計算の問題を 1 つ生成する（生成不可能な場合は undefined を返す）
 * 待ち別点数計算問題生成
 *
 * 点数計算総合演習と同じ面子手の生成器で和了形を作り、和了牌を抜いて
 * 聴牌形にしてから待ち牌を列挙し直す。生成器が選んだ和了牌以外にも
 * 待ちがある形（両面・三面・双碰・変則）だけを出題し、待ちごとに
 * ツモ・ロンの点数計算問題を組み立てる。
 *
 * 出題しない聴牌形:
 * - 待ちが 1 つだけ（総合演習と同じ問題になる）
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
 * Err で返す）ため「立直のみ」の答えを組み立てられない。総合演習も同じ理由で
 * 立直のみの手を出さない
 */
export function generateMachiScoreQuestion(
  options: MachiScoreGeneratorOptions = {},
): MachiScoreQuestion | undefined {
  const {
    includeFuro = true,
    includeParent = true,
    includeChild = true,
    renfonpaiAs4Fu = false,
    kiriageMangan = false,
    yakumanRules,
    allowedRanges = ["nonMangan", "manganPlus"],
    rng = defaultRandomSource,
  } = options;

  // 1. 和了形を作って和了牌を抜き、聴牌形にする
  const generated = generateMentsuTehai(includeFuro, rng);
  if (!generated) return undefined;
  const tehai = toTenpaiTehai(generated.tehai, generated.agariHai);
  if (!tehai) return undefined;
  //    和了牌を抜いた形は聴牌のはずだが、前提が崩れたら黙って出題しない
  const shanten = calculateShanten(tehai, false, false);
  if (shanten.isErr() || shanten.value !== 0) return undefined;

  // 2. 待ち牌の列挙。生成器が選んだ和了牌以外の待ちも拾う
  const waitHais = getUkeire(tehai);
  if (waitHais.length < MIN_WAIT_COUNT) return undefined;
  const agariTehais: Tehai14[] = [];
  for (const hai of waitHais) {
    const agariTehai = toAgariTehai(tehai, hai);
    if (!agariTehai) return undefined;
    agariTehais.push(agariTehai);
  }
  //    門前かどうかは待ちによらない（副露は聴牌形が持つ）
  const menzen = isMenzen(agariTehais[0]);

  // 3. 局面の決定。ドラ表示牌は聴牌形から引く（待ち牌は手牌の外）
  const jikaze = selectJikaze(includeParent, includeChild, rng);
  const bakaze = selectBakaze(jikaze, false, rng);
  const wantsRiichi = menzen && randomBool(0.2, rng);
  const markers = generateDoraMarkers(tehai, wantsRiichi, rng);
  if (!markers) return undefined;
  const { doraMarkers, uraDoraMarkers } = markers;
  //    表示牌に取られて 4 枚目が無い待ち（純カラ）を持つ形は出題しない
  const visibleMarkers = [...doraMarkers, ...(uraDoraMarkers ?? [])];
  for (const hai of waitHais) {
    const visible =
      countHaiInTehai(tehai, hai) +
      visibleMarkers.filter((marker) => marker === hai).length;
    if (visible >= 4) return undefined;
  }

  const ruleConfig: RuleConfig = {
    doubleWindJantouFu: doubleWindJantouFu(renfonpaiAs4Fu),
    kiriageMangan,
    ...yakumanRules,
  };

  // 4. 待ちごとにツモ・ロンを採点する。まずリーチ無しで採点し、役なしの
  //    ロン待ちがあるかを見る（上記の理由でリーチと両立しない）
  const score = (
    agariTehai: Tehai14,
    agariHai: HaiKindId,
    isTsumo: boolean,
    riichi: RiichiInput | undefined,
  ) =>
    buildScoreQuestion({
      tehai: agariTehai,
      agariHai,
      isTsumo,
      jikaze,
      bakaze,
      doraMarkers,
      ruleConfig,
      riichi,
    });

  const scoreAll = (
    riichi: RiichiInput | undefined,
  ): readonly ScoredWait[] | undefined => {
    const scored: ScoredWait[] = [];
    for (const [i, agariHai] of waitHais.entries()) {
      const agariTehai = agariTehais[i];
      const tsumo = score(agariTehai, agariHai, true, riichi);
      //   ツモでも和了れない待ち（副露手の役なし）とトリプル役満以上は出題しない
      if (tsumo.isErr()) return undefined;
      const ron = score(agariTehai, agariHai, false, riichi);
      if (ron.isErr() && ron.error !== "noYaku") return undefined;
      scored.push({
        agariHai,
        agariTehai,
        tsumo: tsumo.value,
        ron: ron.isOk() ? ron.value : undefined,
      });
    }
    return scored;
  };

  const withoutRiichi = scoreAll(undefined);
  if (!withoutRiichi) return undefined;
  const hasNoYakuRon = withoutRiichi.some((wait) => wait.ron === undefined);

  const riichi: RiichiInput | undefined =
    wantsRiichi && uraDoraMarkers && !hasNoYakuRon
      ? { isDouble: randomBool(0.1, rng), uraDoraMarkers }
      : undefined;
  const scoredWaits = riichi ? scoreAll(riichi) : withoutRiichi;
  if (!scoredWaits) return undefined;

  // 5. すべての待ち・和了方法が点数帯と符の選択肢に収まることを確認する
  for (const wait of scoredWaits) {
    for (const question of [wait.tsumo, wait.ron]) {
      if (!question) continue;
      if (!isScoreLevelAllowed(question.answer.scoreLevel, allowedRanges))
        return undefined;
      if (!isFu(question.answer.fu)) return undefined;
    }
  }

  return {
    tehai,
    jikaze,
    bakaze,
    doraMarkers,
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
 * 総合演習より試行回数を要する。
 *
 * @param options - 問題生成オプション
 * @param maxRetries - 最大リトライ回数
 */
export function generateValidMachiScoreQuestion(
  options: MachiScoreGeneratorOptions = {},
  maxRetries: number = 200,
): MachiScoreQuestion | undefined {
  return retryGenerate(() => generateMachiScoreQuestion(options), maxRetries);
}
