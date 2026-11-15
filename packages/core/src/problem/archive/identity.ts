/**
 * 保存した問題の同一性（identity v1）
 * 問題同一性
 *
 * 同じ盤面の問題を 1 行にまとめるための、安定した文字列を作る。ハッシュは
 * 呼び出し側（保存先）が掛ける。
 *
 * 同一性に入れるもの（盤面の条件だけ）:
 * - 純手牌（多重集合。理牌の順に並べ直すので並びの違いは同じ問題）
 * - 副露の列（鳴いた順・種別・牌・チーの鳴いた牌）
 * - 和了形なら和了牌とツモ / ロン
 * - 自風・場風
 * - 表ドラ表示牌の列・リーチの有無・裏ドラ表示牌の列。表示牌の順は点数に
 *   効かないが、盤面の見た目なので順のまま入れる
 *
 * 入れないもの:
 * - 鳴き元（`from`）。生成器が決めるもので点数に効かず、入れると同じ問題が
 *   鳴き元の数（3）だけ別の行に分かれる。盤面の見た目には要るので payload には残す
 * - ルール設定。閲覧者のルールで組み立て直すため（`types.ts`）
 * - 保存形式の版（`schemaVersion`）。形の版が上がっても同じ盤面は同じ問題
 *
 * 色の入れ替えなど、点数が同じになる盤面の同型は判定しない。
 *
 * 規約を変えると旧行と新行が別の問題として並ぶ。変えるときは
 * {@link ARCHIVE_IDENTITY_VERSION} を上げ、旧行の移行を別に設計する。
 */
import { sortHaiCodes } from "@pai-forge/riichi-mahjong";
import { compareNumbers } from "../../core/compare";
import { toHaiKindIds } from "./melds";
import {
  ARCHIVE_IDENTITY_VERSION,
  type ArchivedMeld,
  type ArchivedRiichi,
  type PracticeProblemArchiveRequest,
} from "./types";

/**
 * 純手牌を理牌の順に並べる
 *
 * 検証済みの要求なら牌種 ID だけなので `sortHaiCodes`（理牌の順）で並べる。
 * 範囲外の値を含む入力は牌として並べられないので数値として並べる（並びの
 * 違いを同じ文字列にする性質だけは保つ）。
 */
function canonicalClosed(closed: readonly number[]): number[] {
  const ids = toHaiKindIds(closed);
  return ids ? sortHaiCodes(ids) : [...closed].sort(compareNumbers);
}

/** 副露 1 つ: `[種別, 牌]`。チーだけ鳴いた牌を足す。鳴き元は入れない */
function meldIdentity(meld: ArchivedMeld): unknown[] {
  return meld.type === "chi"
    ? [meld.type, [...meld.hais], meld.nakiHai]
    : [meld.type, [...meld.hais]];
}

/** リーチ: していなければ null、していれば裏ドラ表示牌の列 */
function riichiIdentity(riichi: ArchivedRiichi): number[] | null {
  return riichi === null ? null : [...riichi.uraDoraMarkers];
}

/**
 * 同一性の入力になる安定した文字列を作る（ハッシュはしない）
 * 問題同一性入力
 *
 * 要素の位置を固定した配列を `JSON.stringify` に渡す。オブジェクトのキーの
 * 順に左右されない。種別と同一性の版を先頭に置くので、和了形と聴牌形、
 * 版の違う規約どうしは衝突しない。
 */
export function archiveIdentityInput(
  request: PracticeProblemArchiveRequest,
): string {
  const { payload } = request;
  const hand = [
    canonicalClosed(payload.hand.closed),
    payload.hand.exposed.map(meldIdentity),
  ];
  const scene = [
    payload.jikaze,
    payload.bakaze,
    [...payload.doraMarkers],
    riichiIdentity(payload.riichi),
  ];
  if (request.kind === "agari-score") {
    return JSON.stringify([
      request.kind,
      ARCHIVE_IDENTITY_VERSION,
      ...hand,
      request.payload.agariHai,
      request.payload.isTsumo,
      ...scene,
    ]);
  }
  return JSON.stringify([
    request.kind,
    ARCHIVE_IDENTITY_VERSION,
    ...hand,
    ...scene,
  ]);
}
