import {
  HaiKind,
  calculateScoreForTehai,
  detectYaku,
  isMenzen,
  type HaiKindId,
  type Kazehai,
  type Tehai14,
} from "@pai-forge/riichi-mahjong";
import { BAKAZE_OPTIONS, ScoreLevel, KAZEHAI } from "../../core/constants";
import {
  randomBool,
  randomChoice,
  defaultRandomSource,
  type RandomSource,
} from "../../core/random";

import type {
  ScoreQuestion,
  QuestionGeneratorOptions,
  ScoreRange,
  YakuDetail,
} from "./types";
import { reconcileYakuhai, applyRiichiAndUraDora } from "./utils/reconciler";
import { generateMentsuTehai } from "./strategies/mentsu-strategy";
import { generateChiitoiTehai } from "./strategies/chiitoi-strategy";
import { generateDoraMarkers } from "../shared/dora-utils";
import {
  assembleScoreQuestion,
  buildYakuDetailsFromResult,
} from "./assemble-question";
import { retryGenerate } from "../retry-generate";
import { countKantsu } from "../shared/count-kantsu";
import type { AgariContext } from "../shared/agari-context";
import { doubleWindJantouFu } from "../../rules/settings";
import {
  applyKiriageMangan,
  clampDoubleYakuman,
  isKiriageManganTarget,
  recalculateScore,
} from "../../score/calculator";
import { countDoraInTehai } from "../../core/dora";
import { isOya } from "../../core/kaze";
import { SCORE_YAKU_NAME_MAP } from "../../core/yaku-names";

/** 七対子の日本語表示名（`requiredYaku` / `yakuDetails.name` の語彙） */
const CHIITOITSU = SCORE_YAKU_NAME_MAP.Chiitoitsu;

/**
 * 点数レベルが許可範囲内かどうかを検証する
 * 点数範囲検証
 */
function validateScoreRange(
  scoreLevel: string,
  allowedRanges: readonly ScoreRange[],
): boolean {
  if (
    allowedRanges.length === 1 &&
    allowedRanges[0] === "nonMangan" &&
    scoreLevel !== ScoreLevel.Normal
  )
    return false;
  if (
    allowedRanges.length === 1 &&
    allowedRanges[0] === "manganPlus" &&
    scoreLevel === ScoreLevel.Normal
  )
    return false;
  return true;
}

/**
 * 出題する自風を選択する
 * 自風選択
 */
function selectJikaze(
  includeParent: boolean,
  includeChild: boolean,
  rng: RandomSource,
): Kazehai {
  let candidates: readonly Kazehai[] = KAZEHAI;
  if (!includeParent) candidates = candidates.filter((k) => k !== HaiKind.Ton);
  if (!includeChild) candidates = candidates.filter((k) => k === HaiKind.Ton);
  if (candidates.length === 0) candidates = KAZEHAI;
  return randomChoice(candidates, rng);
}

/**
 * 出題する場風を選択する
 * 場風選択
 *
 * `excludeRenfonpai` が立つと自風と同じ風を落とし、連風牌（場風＝自風）が
 * 成立しない局面だけを出題する（理由は `QuestionGeneratorOptions` の
 * `excludeRenfonpai` に書いてある）。
 *
 * 合計符の出題（`generateTotalFuQuestion`）は逆に場風を先に決めて自風を
 * 落とすが、点数の出題では向きを変えている。あちらの向きだと自風が場風以外の
 * 3択になり、親（東）が出るのは南場のときだけ — 全体の 1/6 にまで下がる。
 * 点数は親と子で別の表を引くため、親の出題が細るのは出題として困る。
 * 場風は東南の2択しかなく、片方を落としても必ず候補が残る。
 */
function selectBakaze(
  jikaze: Kazehai,
  excludeRenfonpai: boolean,
  rng: RandomSource,
): Kazehai {
  const candidates = excludeRenfonpai
    ? BAKAZE_OPTIONS.filter((kaze) => kaze !== jikaze)
    : BAKAZE_OPTIONS;
  return randomChoice(candidates, rng);
}

/**
 * 点数・役計算の入力
 * 点数計算入力
 *
 * 共通の和了状況（{@link AgariContext}）に、点数計算にだけ必要なドラ表示牌と
 * ルール設定を足したもの。
 */
interface ScoringInput extends AgariContext {
  readonly doraMarkers: readonly HaiKindId[];
  readonly ruleConfig: { readonly doubleWindJantouFu: 2 | 4 };
}

/**
 * ライブラリで点数と役を計算する
 * 点数役計算
 *
 * `calculateScoreForTehai` / `detectYaku` は例外を投げうるため、
 * ライブラリ境界であるこの関数内でのみ try/catch で防御し undefined に変換する。
 */
function computeScoreAndYaku(
  tehai: Tehai14,
  context: ScoringInput,
):
  | {
      readonly answer: ReturnType<typeof calculateScoreForTehai>;
      readonly yakuResult: ReturnType<typeof detectYaku>;
    }
  | undefined {
  const { agariHai, isTsumo, jikaze, bakaze, doraMarkers, ruleConfig } =
    context;
  try {
    const answer = calculateScoreForTehai(tehai, {
      agariHai,
      isTsumo,
      jikaze,
      bakaze,
      doraMarkers,
      ruleConfig,
    });
    const yakuResult = detectYaku(tehai, {
      agariHai,
      bakaze,
      jikaze,
      doraMarkers,
      isTsumo,
    });
    return { answer, yakuResult };
  } catch {
    return undefined;
  }
}

/**
 * 点数計算練習の問題を1つ生成する（生成不可能な場合は undefined を返す）
 * 点数計算練習問題生成
 */
export function generateScoreQuestion(
  options: QuestionGeneratorOptions = {},
): ScoreQuestion | undefined {
  const {
    includeFuro = true,
    requireFuro = false,
    includeChiitoi = false,
    includeParent = true,
    includeChild = true,
    renfonpaiAs4Fu = false,
    excludeRenfonpai = false,
    kiriageMangan = false,
    excludeKiriageBoundary = false,
    allowedRanges = ["nonMangan", "manganPlus"],
    minHan = 0,
    requiredYaku,
    allowedFu,
    rng = defaultRandomSource,
  } = options;

  // 1. 手牌の生成（七対子 or 面子手）
  //    七対子は既定では出さない（includeChiitoi）。ただし requiredYaku で
  //    名指しされた場合は面子手をいくら作っても条件を満たせないため、
  //    フラグに関係なく生成対象に含める。七対子しか要求されていないなら
  //    毎回七対子を作る（10%抽選のままだと9割を捨てることになる）。
  const chiitoiRequested = requiredYaku?.includes(CHIITOITSU) ?? false;
  const chiitoiOnly = chiitoiRequested && requiredYaku?.length === 1;
  const isChiitoi =
    chiitoiOnly ||
    ((includeChiitoi || chiitoiRequested) && randomBool(0.1, rng));
  const tehaiResult = isChiitoi
    ? generateChiitoiTehai(rng)
    : generateMentsuTehai(includeFuro, rng);
  if (!tehaiResult) return undefined;
  const { tehai, agariHai } = tehaiResult;
  //    副露縛りは手を作った直後に判定する（点数計算まで進めてから捨てない）
  if (requireFuro && isMenzen(tehai)) return undefined;

  // 2. 和了状況の決定
  const isTsumo = randomBool(0.5, rng);
  const jikaze = selectJikaze(includeParent, includeChild, rng);
  const bakaze = selectBakaze(jikaze, excludeRenfonpai, rng);
  const kantsuCount = countKantsu(tehai);
  const doraMarkers = generateDoraMarkers(kantsuCount, rng);

  // 3. 点数・役の計算（ライブラリ境界）
  const scored = computeScoreAndYaku(tehai, {
    agariHai,
    isTsumo,
    jikaze,
    bakaze,
    doraMarkers,
    ruleConfig: {
      doubleWindJantouFu: doubleWindJantouFu(renfonpaiAs4Fu),
    },
  });
  if (!scored) return undefined;

  // 4. 役牌の照合と補正
  let yakuDetails: YakuDetail[] = buildYakuDetailsFromResult(scored.yakuResult);
  const reconciled = reconcileYakuhai(
    tehai,
    scored.yakuResult,
    yakuDetails,
    scored.answer,
    bakaze,
    jikaze,
    isTsumo,
  );
  let finalAnswer = reconciled.answer;
  yakuDetails = [...yakuDetails, ...reconciled.additionalYakuDetails];
  if (finalAnswer.han === 0) return undefined;

  // 5. リーチ・裏ドラの適用（門前のみ、確率20%）
  //    リーチの抽選はここが唯一の判定。isRiichi が true の問題は必ず
  //    立直の翻と裏ドラ表示牌を持つ（出題表示と正解が食い違わない）。
  const isRiichi = isMenzen(tehai) && randomBool(0.2, rng);
  let uraDoraMarkers: readonly HaiKindId[] | undefined;
  if (isRiichi) {
    const markers = generateDoraMarkers(kantsuCount, rng);
    const riichiRes = applyRiichiAndUraDora({
      tehai,
      currentAnswer: finalAnswer,
      uraDoraMarkers: markers,
      isDoubleRiichi: randomBool(0.1, rng),
      isTsumo,
      jikaze,
    });
    finalAnswer = riichiRes.answer;
    uraDoraMarkers = markers;
    yakuDetails = [...yakuDetails, ...riichiRes.additionalYakuDetails];
  }

  // 5.5. 翻数を役の内訳に合わせる
  //
  //    ライブラリの `detectYaku` と `calculateScoreForTehai` は同じ手牌で
  //    食い違うことがある。門前の清一色（6翻）・混一色（3翻）・混全帯么九
  //    （2翻）を含む手で、後者が副露のときの値で数えて 1〜2 翻少なくなる。
  //    30000 手の生成で 19 件（0.06%）、いずれも門前で、うち 2 件は点数帯まで
  //    変わっていた（跳満と出すべき手を満貫にする等）。
  //
  //    門前の手に門前の翻を与える `detectYaku` の方がルール上正しいので、
  //    内訳の合計を翻数の正典にする。役牌の照合（`reconcileYakuhai`）と同じ
  //    考え方で、内訳と翻数と点数が画面上で必ず一致することも保証される
  //    （結果ページが役の内訳を出すため、ここがずれると見えてしまう）。
  //
  //    この時点の `yakuDetails` は表ドラを持たない（`assembleScoreQuestion`
  //    が後で足す）ため、合計にはドラの翻を明示的に加える。
  const doraHan = countDoraInTehai(tehai, doraMarkers);
  const detailsHan =
    yakuDetails.reduce((total, yaku) => total + yaku.han, 0) + doraHan;
  if (detailsHan !== finalAnswer.han) {
    finalAnswer = recalculateScore(finalAnswer, detailsHan, {
      isTsumo,
      isOya: isOya(jikaze),
    });
  }

  // 6. ダブル役満の点数を役満に丸める（26翻以上も役満として扱うアプリ全体の
  //    決定に点数を合わせる。丸めないと 64000 のようにどの点数リストにも
  //    無い点数が正解になり、選択肢から選べない問題が出る）
  finalAnswer = clampDoubleYakuman(finalAnswer, {
    isTsumo,
    isOya: isOya(jikaze),
  });

  // 7. 切り上げ満貫で点数が割れる手（30符4翻・60符3翻）の除外
  //    切り上げる前の結果で判定する。切り上げた後は満貫になっていて
  //    「境界だった」ことが読めなくなるため
  if (excludeKiriageBoundary && isKiriageManganTarget(finalAnswer))
    return undefined;

  // 8. 切り上げ満貫の適用（30符4翻・60符3翻を満貫の点数に切り上げ）
  if (kiriageMangan) {
    finalAnswer = applyKiriageMangan(finalAnswer, {
      isTsumo,
      isOya: isOya(jikaze),
    });
  }

  // 9. 点数帯・最小翻数・符・役の検証と組み立て
  //    minHan はリーチ・裏ドラ適用後の最終翻数で判定する（出題表示と一致させる）
  if (!validateScoreRange(finalAnswer.scoreLevel, allowedRanges))
    return undefined;
  if (finalAnswer.han < minHan) return undefined;
  //    符は点数計算が実際に採った解釈の符で判定する。役の判定とは解釈が
  //    分かれうるため（`allowedFu` 参照）、yakuDetails 側では弾けない
  if (allowedFu !== undefined && !allowedFu.includes(finalAnswer.fu))
    return undefined;
  //    役の絞り込みも最終形の yakuDetails（役牌の照合・リーチ適用後）で判定する。
  //    複数指定は OR（いずれか1つでも成立していれば出題）
  if (
    requiredYaku !== undefined &&
    requiredYaku.length > 0 &&
    !yakuDetails.some((yaku) => requiredYaku.includes(yaku.name))
  )
    return undefined;

  return assembleScoreQuestion({
    tehai,
    agariHai,
    isTsumo,
    jikaze,
    bakaze,
    doraMarkers,
    isRiichi,
    uraDoraMarkers,
    answer: finalAnswer,
    originalAnswer: scored.answer,
    yakuDetails,
  });
}

/**
 * 有効な問題が生成されるまでリトライするヘルパー
 * 有効問題生成
 *
 * @param options - 問題生成オプション
 * @param maxRetries - 最大リトライ回数
 */
export function generateValidScoreQuestion(
  options: QuestionGeneratorOptions = {},
  maxRetries: number = 100,
): ScoreQuestion | undefined {
  return retryGenerate(() => generateScoreQuestion(options), maxRetries);
}
