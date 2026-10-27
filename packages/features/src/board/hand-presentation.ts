import { mulberry32, type HaiKindId } from "@mahjong-scoring/core";

import { hasPracticeTools, type PlanBenefit } from "../billing/plans";
import { DEFAULT_TILE_ORDER, type TileOrderMode } from "../settings/tile-order";
import {
  DEFAULT_TILE_ORIENTATION,
  type TileOrientationMode,
} from "../settings/tile-orientation";
import type { SplitTehai } from "./agari-hai";

/** 有効な見せ方の設定 */
export interface HandPresentationSettings {
  /** 有効な向きの設定（特典が無ければ保存値に関わらず `upright`） */
  readonly orientation: TileOrientationMode;
  /** 有効な並べ方の設定（特典が無ければ保存値に関わらず `sorted`） */
  readonly order: TileOrderMode;
}

/** 従来の表示（すべて正規の向き・理牌したまま） */
export const DEFAULT_HAND_PRESENTATION_SETTINGS: HandPresentationSettings = {
  orientation: DEFAULT_TILE_ORIENTATION,
  order: DEFAULT_TILE_ORDER,
};

/**
 * 確定した手牌の見せ方
 * 手牌表示スナップショット
 *
 * 練習の画面を開いたときに一度だけ決め、その画面の間は変えない
 * （`use-hand-presentation.ts` の Provider が確定する）。
 *
 * 記録（`leaderboard_key`・結果の保存）には載せない。出題・正解・採点は向きにも
 * 並びにも依らず、解答を補助する情報も足さない（一般に読む負荷を増やす表示設定）
 * ので、逆さの牌を混ぜた回・理牌しない回も通常の回と同じ記録の区分に積む。
 * 昇級試験の本番にも同じく適用する（試験だけ外すと設定・模試・本番の挙動が
 * 食い違う）。個々の手・利用者で必ず難しくなる保証ではない。自己ベストや履歴から
 * 当時の見せ方は分からない。見せ方ごとに区分を分けると母集団が割れ、記録の
 * メタデータに残すには保存と表示の変更が要るため、どちらもいまは採らない。
 */
export interface HandPresentationSnapshot extends HandPresentationSettings {
  /**
   * 実行環境（web のドキュメント・アプリの JS ランタイム）で共通の種
   *
   * 32bit の整数。同じ種・同じ手牌なら同じ配置になる。
   */
  readonly sessionSeed: number;
}

/**
 * 1 つの手牌の見せ方
 * 手牌表示
 *
 * 添字は和了牌を切り離した（{@link import("./agari-hai").splitAgariHai}）後の
 * 純手牌に対するもの。和了牌入りの配列の添字ではない。
 */
export interface HandPresentation {
  /**
   * 表示位置ごとに、分離後の純手牌のどの添字の牌を置くか
   *
   * 重複・欠落の無い置換。`sorted` なら恒等置換。
   */
  readonly closedOrder: readonly number[];
  /**
   * 表示位置ごとの上下逆さ（`closedOrder` と同じ長さ）
   *
   * 向きは「表示位置」に属し、特定の牌に付いて回るものではない。並べ方を
   * 変えても同じ位置の向きは変わらない。
   */
  readonly closedInverted: readonly boolean[];
  /** 切り離した和了牌の上下逆さ。和了牌が無ければ false */
  readonly agariInverted: boolean;
}

/**
 * 保存した設定と特典から、有効な見せ方を決める
 * 手牌表示設定解決
 *
 * 上下ランダム・理牌しないはどちらも Pro の `practice_tools` 特典（回答時間の
 * 計測と同じ特典を再利用する。買い切り・App Store の購入も含め、既存の購入者が
 * 同じ権利で使える。権利を分ける理由がまだ無いので新しい特典は作らない）。
 * 特典が無ければ保存値に関わらず両方とも既定に落とす（片方だけ落とす経路は
 * 無い）。保存値は書き換えない — Pro を買い直せば元の設定に戻る。
 *
 * @param saved 保存した向きと並べ方の希望
 * @param benefits 閲覧者が持つ特典
 */
export function resolveHandPresentationSettings(
  saved: HandPresentationSettings,
  benefits: readonly PlanBenefit[],
): HandPresentationSettings {
  if (!hasPracticeTools(benefits)) {
    return DEFAULT_HAND_PRESENTATION_SETTINGS;
  }
  return { orientation: saved.orientation, order: saved.order };
}

/** FNV-1a の初期値と素数（32bit） */
const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/** 和了牌が無いことを表す値（牌の値 0〜36 と衝突しない） */
const NO_AGARI_HAI = -1;

/** 向きと順序の系列を分けるための塩 */
const ORIENTATION_STREAM = 0x4f524945;
const ORDER_STREAM = 0x4f524445;

/**
 * 32bit の整数列を 1 つの 32bit 整数に畳む（FNV-1a を 4 バイトずつ）
 *
 * web と React Native で同じ値になるよう、浮動小数点を介さず
 * `Math.imul` と符号なしシフトだけで計算する。
 */
function hashIntegers(values: readonly number[]): number {
  let hash = FNV_OFFSET_BASIS;
  for (const value of values) {
    for (let shift = 0; shift < 32; shift += 8) {
      hash ^= (value >>> shift) & 0xff;
      hash = Math.imul(hash, FNV_PRIME);
    }
  }
  return hash >>> 0;
}

/**
 * 種と手牌から入力種を作る
 *
 * 列の長さ・和了牌の有無を明示し、[1,2]+[3] と [1]+[2,3] のような連結の
 * 曖昧さを避ける。赤 5 は通常の 5 と別の値のまま混ぜる。副露・問題 ID・
 * 回答・時刻は入れない — 採点後に問題オブジェクトが差し替わっても、同じ手牌なら
 * 盤面が同じに見えるように。
 */
function deriveHandSeed(split: SplitTehai, sessionSeed: number): number {
  return hashIntegers([
    sessionSeed,
    split.closedTiles.length,
    ...split.closedTiles,
    split.separatedAgariHai === undefined ? 0 : 1,
    split.separatedAgariHai ?? NO_AGARI_HAI,
  ]);
}

/** 恒等置換 */
function identityOrder(length: number): readonly number[] {
  return Array.from({ length }, (_, index) => index);
}

/** Fisher–Yates で置換を作る */
function shuffledOrder(length: number, random: () => number): number[] {
  const order = Array.from({ length }, (_, index) => index);
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const held = order[i];
    const swapped = order[j];
    if (held === undefined || swapped === undefined) continue;
    order[i] = swapped;
    order[j] = held;
  }
  return order;
}

/**
 * 手牌の見せ方を計算する
 * 手牌表示計算
 *
 * 見せ方だけを変える。問題の生成・正解判定・採点・解説は理牌済みの元の手牌を
 * そのまま使い、ここで作った添字を回答や採点に流さない（待ち牌の選択肢・面子の
 * 内訳は理牌・正規の向きのまま）。
 *
 * 同じ種・同じ純手牌・同じ和了牌なら常に同じ結果になる純粋な計算で、
 * キャッシュが失われても結果は変わらない。同じ手が再び出れば同じ配置になるが、
 * それは「ランダムな向きを読む練習」として許容している（配置が毎回違うことを
 * 前提にしない）。種が違えば別の配置になりうるが、偶然一致してもよい。
 *
 * 順序と向きは同じ入力種から別々の系列で決める。向きの系列は並べ方に依らず、
 * 各牌の上下は独立に 1/2。`random` でも全牌が正規の向きになることはある。
 *
 * 並べ方は置換を作る側と表示側で値の出所を 1 つにするため、引数ではなく
 * `snapshot.order` から読む。偶然ほぼ理牌どおりの並びになることは許容し、
 * 「理牌と違う並び」になるまで引き直さない（決定性と単純さを優先）。
 *
 * @param split 和了牌を切り離した手牌（`splitAgariHai` の結果）
 * @param snapshot 確定した見せ方
 */
export function buildHandPresentation(
  split: SplitTehai,
  snapshot: HandPresentationSnapshot,
): HandPresentation {
  const length = split.closedTiles.length;
  const hasAgari = split.separatedAgariHai !== undefined;
  const handSeed = deriveHandSeed(split, snapshot.sessionSeed);

  const closedOrder =
    snapshot.order === "unsorted"
      ? shuffledOrder(
          length,
          mulberry32(hashIntegers([handSeed, ORDER_STREAM])),
        )
      : identityOrder(length);

  if (snapshot.orientation === "upright") {
    return {
      closedOrder,
      closedInverted: Array.from({ length }, () => false),
      agariInverted: false,
    };
  }

  const random = mulberry32(hashIntegers([handSeed, ORIENTATION_STREAM]));
  const closedInverted = Array.from({ length }, () => random() < 0.5);
  const agariInverted = random() < 0.5;
  return {
    closedOrder,
    closedInverted,
    agariInverted: hasAgari && agariInverted,
  };
}

/** 盤面に置く牌 1 枚 */
export interface PresentedHai {
  readonly hai: HaiKindId;
  /** 上下逆さに描くか */
  readonly inverted: boolean;
}

/** 盤面に置く純手牌と和了牌 */
export interface PresentedTehai {
  /** 表示位置の順に並べた純手牌 */
  readonly closed: readonly PresentedHai[];
  /** 切り離した和了牌。無ければ undefined */
  readonly agari: PresentedHai | undefined;
}

/** 見せ方の検査で見つかった不整合 */
export type HandPresentationError =
  | "orderLength"
  | "orderIndex"
  | "orderDuplicate"
  | "invertedLength"
  | "invertedValue"
  | "agariInvertedValue"
  | "agariInvertedWithoutAgari";

/** 見せ方の検査結果 */
export type HandPresentationValidation =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: HandPresentationError };

/**
 * 見せ方が手牌に合っているかを検査する
 * 手牌表示検査
 *
 * 置換の長さ・整数・範囲・重複（重複が無く長さが合えば欠落も無い）、
 * 上下の配列の長さと真偽値、和了牌が無いのに和了牌を逆さにする指定を見る。
 * 型の上では満たしていても、別の手牌の見せ方を渡し間違えたときに牌を落とす・
 * 増やすことがないよう、描く直前に確かめる。
 *
 * @param split 和了牌を切り離した手牌
 * @param presentation 検査する見せ方
 */
export function validateHandPresentation(
  split: SplitTehai,
  presentation: HandPresentation,
): HandPresentationValidation {
  const length = split.closedTiles.length;
  const { closedOrder, closedInverted, agariInverted } = presentation;
  if (closedOrder.length !== length) return { ok: false, error: "orderLength" };
  const seen = new Set<number>();
  for (const index of closedOrder) {
    if (!Number.isInteger(index) || index < 0 || index >= length) {
      return { ok: false, error: "orderIndex" };
    }
    if (seen.has(index)) return { ok: false, error: "orderDuplicate" };
    seen.add(index);
  }
  if (closedInverted.length !== length) {
    return { ok: false, error: "invertedLength" };
  }
  // 型の外から来た値（不正な状態）も弾けるよう、unknown として真偽値を確かめる
  const invertedValues: readonly unknown[] = closedInverted;
  if (!invertedValues.every((value) => typeof value === "boolean")) {
    return { ok: false, error: "invertedValue" };
  }
  const agariValue: unknown = agariInverted;
  if (typeof agariValue !== "boolean") {
    return { ok: false, error: "agariInvertedValue" };
  }
  if (split.separatedAgariHai === undefined && agariInverted) {
    return { ok: false, error: "agariInvertedWithoutAgari" };
  }
  return { ok: true };
}

/** 理牌・正規の向きのまま並べる */
function presentDefault(split: SplitTehai): PresentedTehai {
  return {
    closed: split.closedTiles.map((hai) => ({ hai, inverted: false })),
    agari:
      split.separatedAgariHai === undefined
        ? undefined
        : { hai: split.separatedAgariHai, inverted: false },
  };
}

/**
 * 手牌を見せ方どおりに並べる
 * 手牌表示適用
 *
 * 見せ方を省略した・検査（{@link validateHandPresentation}）に通らないときは、
 * 一部だけを採らず全体を従来の表示（理牌・正規の向き）に戻す。元の配列は
 * 変えず、牌を落としたり増やしたりしない。
 *
 * @param split 和了牌を切り離した手牌
 * @param presentation 見せ方。省略時は従来の表示
 */
export function presentTehai(
  split: SplitTehai,
  presentation: HandPresentation | undefined,
): PresentedTehai {
  if (presentation === undefined) return presentDefault(split);
  if (!validateHandPresentation(split, presentation).ok) {
    return presentDefault(split);
  }
  const closed: PresentedHai[] = [];
  presentation.closedOrder.forEach((index, position) => {
    const hai = split.closedTiles[index];
    if (hai === undefined) return;
    closed.push({
      hai,
      inverted: presentation.closedInverted[position] === true,
    });
  });
  return {
    closed,
    agari:
      split.separatedAgariHai === undefined
        ? undefined
        : {
            hai: split.separatedAgariHai,
            inverted: presentation.agariInverted,
          },
  };
}
