"use client";

import { useCallback, useEffect, useRef } from "react";

import type { BeginPracticeQuestionResult } from "./answer";
import type { PracticeQuotaGate, QuotaOutcome } from "./gate";
import type { QuotaMenu } from "./limits";
import type { createPracticeQuotaGate } from "./use-practice-quota-gate";

/** {@link createPracticeQuotaGate} が返す、アプリごとに 1 つのゲート */
export type PracticeQuotaGates = ReturnType<typeof createPracticeQuotaGate>;

/**
 * 盤面の回数制限の操作（{@link usePracticeQuotaControl} の戻り値）
 * 回数制限操作
 *
 * web とアプリの盤面が同じ形で受け取る。アプリ固有の操作はこれを extends する。
 */
export interface PracticeQuotaControl {
  /**
   * 1 問始める。無料枠の消費を聞き、許可されたら `generate` を呼ぶ。許可されな
   * ければ `gate` が `blocked` になり、呼び出し側はペイウォールを出す
   */
  readonly requestQuestion: () => Promise<void>;
  /**
   * 残数と特典を消費せずに取り直す。盤面を離れて戻ってきたとき、解答中の
   * 問題を引き継ぎながら、離れている間の購入・ログイン・日付の変わり目を
   * 表示に反映させる。失敗・レート制限のときは今の `gate` を保つ
   */
  readonly refreshGate: () => Promise<void>;
  /** 返事を待っている間 true。「次の問題へ」はこの間押せなくする */
  readonly isChecking: boolean;
  /** 直近の結果。まだ一度も聞いていなければ undefined */
  readonly gate: PracticeQuotaGate | undefined;
}

/**
 * 出題許可の問い合わせ先。web は Server Action、アプリは API と端末の数え方
 * 回数制限の問い合わせ先
 */
export interface PracticeQuotaSource {
  /** 枠を 1 つ消費して聞く。投げたら確かめられなかった扱い（fail-open） */
  readonly ask: (menu: QuotaMenu) => Promise<QuotaOutcome>;
  /** 残数と特典を消費せずに読む。確かめられなければ undefined */
  readonly peek: (
    menu: QuotaMenu,
  ) => Promise<BeginPracticeQuestionResult | undefined>;
}

/**
 * エンドレス練習の無料枠ゲートを盤面に結び付ける
 * 練習回数ゲート
 *
 * 問題の生成（端末の中・同期）の前に回数制限の問い合わせを 1 回挟む。盤面は
 * 「生成する」の代わりに `requestQuestion()` を呼ぶだけで、答えの出どころ
 * （サーバー・端末・Pro の無制限）を知らない。状態遷移（fail-open・古い
 * 返事を捨てる・盤面を離れても捨てない）は {@link createPracticeQuotaGate}
 * が持ち、ここはその要求に最新の `generate` を結び付けるだけ。
 *
 * @design アンマウント後の返事は捨てない
 *
 * 返事を待つ間に盤面を離れても、サーバーはもう 1 問ぶん消費している。
 * 返事が届いたら問題を生成してストアに入れておけば、戻ってきたときに
 * その問題を続けられる（捨てると戻った盤面がもう 1 問消費する）。生成先の
 * 練習ストアも、ゲートの状態もモジュールスコープなので、盤面が無くても
 * 書ける。
 *
 * @param gates - アプリのゲート（モジュールスコープで 1 つ）
 * @param menu - 練習（回数制限の単位）
 * @param source - 問い合わせ先
 * @param generate - 許可されたときに呼ぶ生成処理。参照が変わっても最新のものを呼ぶ
 */
export function usePracticeQuotaControl(
  gates: PracticeQuotaGates,
  menu: QuotaMenu,
  source: PracticeQuotaSource,
  generate: () => void,
): PracticeQuotaControl {
  const { gate, isChecking } = gates.useMenuState(menu);
  const generateRef = useRef(generate);

  // 最新の generate を効果の中で控える（描画中に ref へ書かない）
  useEffect(() => {
    generateRef.current = generate;
  });

  const requestQuestion = useCallback(
    () =>
      gates.request(
        menu,
        () => source.ask(menu),
        () => generateRef.current(),
      ),
    [gates, menu, source],
  );

  const refreshGate = useCallback(
    () => gates.refresh(menu, () => source.peek(menu)),
    [gates, menu, source],
  );

  return { requestQuestion, refreshGate, isChecking, gate };
}
