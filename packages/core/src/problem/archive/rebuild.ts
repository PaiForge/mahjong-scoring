import { err, ok, type Result } from "neverthrow";
import {
  isKazehai,
  isMenzen,
  type CompletedMentsu,
  type HaiKindId,
  type Kazehai,
  type RuleConfig,
} from "@pai-forge/riichi-mahjong";
import { isHaiKindId } from "../../core/type-guards";
import { isFu } from "../../score/constants";
import { buildScoreQuestion, type RiichiInput } from "../score/build-question";
import type { ScoreQuestion } from "../score/types";
import { finalizeTehai13, finalizeTehai14 } from "../shared/hand-skeleton";
import { buildTenpaiScoreQuestion } from "../tenpai-score/generator";
import type { TenpaiScoreQuestion } from "../tenpai-score/types";
import { fromArchivedMeld, toHaiKindIds } from "./melds";
import type {
  AgariProblemPayload,
  ArchiveRebuildError,
  ArchivedHand,
  ArchivedRiichi,
  TenpaiProblemPayload,
} from "./types";

/** 盤面の局面（風・表示牌・リーチ）を牌種 ID の型に戻したもの */
interface RestoredScene {
  readonly closed: readonly HaiKindId[];
  readonly exposed: readonly CompletedMentsu[];
  readonly jikaze: Kazehai;
  readonly bakaze: Kazehai;
  readonly doraMarkers: readonly HaiKindId[];
  readonly riichi: RiichiInput | undefined;
}

function toKazehai(value: number): Kazehai | undefined {
  return isHaiKindId(value) && isKazehai(value) ? value : undefined;
}

function restoreExposed(
  melds: ArchivedHand["exposed"],
): CompletedMentsu[] | undefined {
  const restored: CompletedMentsu[] = [];
  for (const meld of melds) {
    const mentsu = fromArchivedMeld(meld);
    if (!mentsu) return undefined;
    restored.push(mentsu);
  }
  return restored;
}

/** null はリーチなし。裏ドラ表示牌に範囲外の牌があれば失敗 */
function restoreRiichi(
  riichi: ArchivedRiichi,
): Result<RiichiInput | undefined, "invalidPayload"> {
  if (riichi === null) return ok(undefined);
  const uraDoraMarkers = toHaiKindIds(riichi.uraDoraMarkers);
  return uraDoraMarkers ? ok({ uraDoraMarkers }) : err("invalidPayload");
}

/**
 * 盤面の数値を牌種 ID・風・面子に戻す（範囲外の値・不正な副露は失敗）
 * 盤面復元
 */
function restoreScene(
  payload: TenpaiProblemPayload,
): Result<RestoredScene, "invalidPayload"> {
  const closed = toHaiKindIds(payload.hand.closed);
  const exposed = restoreExposed(payload.hand.exposed);
  const jikaze = toKazehai(payload.jikaze);
  const bakaze = toKazehai(payload.bakaze);
  const doraMarkers = toHaiKindIds(payload.doraMarkers);
  const riichi = restoreRiichi(payload.riichi);
  if (
    !closed ||
    !exposed ||
    jikaze === undefined ||
    bakaze === undefined ||
    !doraMarkers ||
    riichi.isErr()
  ) {
    return err("invalidPayload");
  }
  return ok({
    closed,
    exposed,
    jikaze,
    bakaze,
    doraMarkers,
    riichi: riichi.value,
  });
}

/**
 * 和了形の盤面から、指定したルールで点数計算の問題を組み立て直す
 * 和了形問題再構築
 *
 * 盤面は保存時に標準ルールで検証済みだが、ルール設定は保存していない
 * （端末ローカルの設定で、練習は閲覧者の設定どおりに出題する）。閲覧者の
 * ルールで組み立て直し、そのルールで組み立てられない盤面（役満 3 個分以上に
 * なるなど）は Err で返す。呼び出し側はその盤面をその場で出題から外す。
 *
 * 生成器と同じ `buildScoreQuestion` を通るので、生成時と同じルールを渡せば
 * 生成した問題と同じ問題が返る。乱数は使わない。
 *
 * 回答の符選択肢に無い符（110 符超）になる盤面も Err（`fuOutOfOptions`）にする
 * （聴牌形の {@link rebuildTenpaiQuestion} と同じ扱い）。符はルールで変わる —
 * 連風牌の雀頭を 4 符とするルールでは、標準ルールで 110 符に収まっていた手が
 * 選択肢の外へ出うる。ここで見ないと、保存時の検証（標準ルール）を通った盤面が、
 * 閲覧者のルールでは答えを選べない問題として出る。
 */
export function rebuildAgariQuestion(
  payload: AgariProblemPayload,
  ruleConfig: RuleConfig,
): Result<ScoreQuestion, ArchiveRebuildError> {
  const scene = restoreScene(payload);
  if (scene.isErr()) return err(scene.error);
  const { agariHai } = payload;
  if (!isHaiKindId(agariHai)) return err("invalidPayload");
  const tehai = finalizeTehai14(scene.value.closed, scene.value.exposed);
  if (!tehai) return err("invalidHand");
  if (!tehai.closed.includes(agariHai)) return err("agariHaiNotInHand");
  if (scene.value.riichi && !isMenzen(tehai)) return err("riichiWithFuro");

  const built = buildScoreQuestion({
    tehai,
    agariHai,
    isTsumo: payload.isTsumo,
    jikaze: scene.value.jikaze,
    bakaze: scene.value.bakaze,
    doraMarkers: scene.value.doraMarkers,
    ruleConfig,
    riichi: scene.value.riichi,
  });
  if (built.isErr()) return err(built.error);
  if (!isFu(built.value.answer.fu)) return err("fuOutOfOptions");
  return ok(built.value);
}

/**
 * 聴牌形の盤面から、指定したルールで聴牌形の点数計算の問題を組み立て直す
 * 聴牌形問題再構築
 *
 * 待ちを列挙し直し、待ちごとにツモ・ロンを採点する（`buildTenpaiScoreQuestion`）。
 * ルールを保存しない理由と、組み立てられない盤面の扱いは
 * {@link rebuildAgariQuestion} と同じ。組み立てられる条件は生成器が出題する
 * 聴牌形の条件（出題設定に依らないもの）と同じで、回答の符選択肢に無い符に
 * なる待ちを持つ盤面も Err（`fuOutOfOptions`）にする。乱数は使わない。
 */
export function rebuildTenpaiQuestion(
  payload: TenpaiProblemPayload,
  ruleConfig: RuleConfig,
): Result<TenpaiScoreQuestion, ArchiveRebuildError> {
  const scene = restoreScene(payload);
  if (scene.isErr()) return err(scene.error);
  const tehai = finalizeTehai13(scene.value.closed, scene.value.exposed);
  if (!tehai) return err("invalidHand");

  const built = buildTenpaiScoreQuestion({
    tehai,
    jikaze: scene.value.jikaze,
    bakaze: scene.value.bakaze,
    doraMarkers: scene.value.doraMarkers,
    riichi: scene.value.riichi,
    ruleConfig,
  });
  if (built.isErr()) return err(built.error);
  return ok(built.value);
}
