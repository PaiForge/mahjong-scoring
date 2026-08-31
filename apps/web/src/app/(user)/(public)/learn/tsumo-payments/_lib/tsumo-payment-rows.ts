import {
  calculateBasePoints,
  calculateKoScore,
  calculateOyaScore,
  isInvalidCell,
  type TsumoPayment,
} from "@mahjong-scoring/core";

import { HAN_COLS } from "@/app/(user)/(public)/reference/score-table/_lib/score-table-utils";

/**
 * 子のツモ支払いを取り出す。
 *
 * `calculateKoScore` の戻り値は子ツモ・親ツモの union なので、子の計算だと
 * 分かっている箇所でも型の上では絞り込みが要る。その1回きりの手当てをここに閉じる。
 */
function koTsumoOf(
  han: number,
  fu: number,
): { readonly fromKo: number; readonly fromOya: number } {
  const { tsumo } = calculateKoScore(han, fu);
  if (tsumo.type !== "koTsumo") {
    throw new Error("calculateKoScore が子ツモ以外の支払いを返した");
  }
  return { fromKo: tsumo.fromKo, fromOya: tsumo.fromOya };
}

/** 切り上げ前と実際の支払いを並べた1行 */
export interface TsumoSplitRow {
  readonly han: number;
  /** 100点単位に切り上げる前。下段はちょうど上段の2倍になる */
  readonly beforeCeil: TsumoPayment;
  /** 実際に払う額（切り上げ後） */
  readonly actual: TsumoPayment;
}

/**
 * 子ツモの2つの数字を、切り上げ前後で並べる
 * 子ツモの内訳
 *
 * 子が払う額は基本符の1倍、親が払う額は2倍。切り上げる前を並べると
 * その比がそのまま見えるが、切り上げは上段・下段へ別々に効くため、
 * 表に載る数字では2倍にならないことがある（30符1翻の 300 と 500 など）。
 * その食い違いを見せるための行。
 *
 * 満貫に届く符を渡すと頭打ちで比が崩れて見えるため、呼び出し側は4翻でも
 * 満貫に届かない符（30符など）を渡すこと。
 *
 * @param fu 対象の符
 */
export function buildTsumoSplitRows(fu: number): readonly TsumoSplitRow[] {
  return HAN_COLS.flatMap((han) => {
    if (isInvalidCell(han, fu, "tsumo")) return [];
    const base = calculateBasePoints(han, fu);
    const { fromKo, fromOya } = koTsumoOf(han, fu);
    return [
      {
        han,
        beforeCeil: {
          type: "koTsumo",
          fromKo: base,
          fromOya: base * 2,
        } satisfies TsumoPayment,
        actual: { type: "koTsumo", fromKo, fromOya } satisfies TsumoPayment,
      },
    ];
  });
}

/** ツモの支払い1口ぶん */
export interface TsumoPaymentEntry {
  /** 誰が出すか */
  readonly payer: "ko" | "oya";
  readonly amount: number;
  /**
   * 子の和了・親の和了の両方に現れる額か。
   * どちらの場面でも「基本符の2つ分」にあたる支払いがこれで、章はここを指す。
   */
  readonly shared: boolean;
}

/** 子が和了った場合と親が和了った場合の支払いを突き合わせたもの */
export interface TsumoComparison {
  /** 子の和了。和了っていない3人（子・子・親）が出す */
  readonly koWin: readonly TsumoPaymentEntry[];
  /** 親の和了。和了っていない3人（子・子・子）が出す */
  readonly oyaWin: readonly TsumoPaymentEntry[];
  /** 両方に現れる額（基本符の2つ分） */
  readonly sharedAmount: number;
  /** 基本符の1つ分。子ひとりが出す額にあたる */
  readonly unitAmount: number;
}

/**
 * ツモの支払いを、子の和了・親の和了の2場面に展開する
 * ツモ支払いの対比
 *
 * 点数表は「1000/2000」のように和了者から見た2つの数字で書くが、場に出ている
 * のは3人ぶんの支払いで、その数え方は基本符を1つ分としたときの口数で決まる。
 * 子は1つ分、親は2つ分。子が和了れば親だけが2つ分を出し、親が和了れば親が
 * 受け取るので子3人とも2つ分を出す。向きが逆でも「親がからむ支払い」は
 * どちらも2つ分なので、同じ額になる。
 *
 * 表で2列を突き合わせると「たまたま同じ数字が並んでいる」ようにしか見えない
 * ため、支払いを場面ごとに展開して、同じ額が同じ理由で出ていることを示す形に
 * している。
 *
 * @param fu 対象の符
 * @param han 対象の翻数
 */
export function buildTsumoComparison(fu: number, han: number): TsumoComparison {
  const { fromKo, fromOya } = koTsumoOf(han, fu);
  const oya = calculateOyaScore(han, fu).tsumo;
  if (oya.type !== "oyaTsumo") {
    throw new Error("calculateOyaScore が親ツモ以外の支払いを返した");
  }

  return {
    koWin: [
      { payer: "ko", amount: fromKo, shared: false },
      { payer: "ko", amount: fromKo, shared: false },
      { payer: "oya", amount: fromOya, shared: true },
    ],
    oyaWin: [
      { payer: "ko", amount: oya.all, shared: true },
      { payer: "ko", amount: oya.all, shared: true },
      { payer: "ko", amount: oya.all, shared: true },
    ],
    sharedAmount: fromOya,
    unitAmount: fromKo,
  };
}
