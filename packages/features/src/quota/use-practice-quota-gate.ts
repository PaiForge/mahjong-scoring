import { create } from "zustand";

import type { BeginPracticeQuestionResult } from "./answer";
import type { MenuQuotaState, QuotaOutcome } from "./gate";
import { QUOTA_MENUS, type QuotaMenu } from "./limits";

interface PracticeQuotaStoreState {
  readonly menus: Readonly<Partial<Record<QuotaMenu, MenuQuotaState>>>;
}

const IDLE: MenuQuotaState = { gate: undefined, isChecking: false };

/**
 * 練習ごとの出題ゲートを作る
 * 出題ゲートストア
 *
 * web とアプリの回数制限のゲートが共有する状態遷移。問い合わせ先
 * （Server Action・アプリ向け API・端末の数え方）は呼び出し側が関数で渡す。
 * アプリごとに 1 回だけモジュールスコープで呼び、戻り値を共有すること。
 *
 * @design 盤面のローカル state ではなくモジュールスコープに置く
 *
 * 練習の問題を持つストア（`useAgariScoreStore` 等）と同じく、盤面を離れても
 * 捨てられない。返事を待つ間に盤面を離れても、届いた返事で問題を作って
 * ストアに入れられるように、生成先の練習ストアと同じ寿命にする。
 *
 * @design 古い返事は捨てる
 *
 * 連打や自動で次へで要求が重なったとき、後から始めた要求の返事だけを採用する
 * （練習ごとの連番）。先の返事で生成し、後の返事でも生成すると 1 回の操作で
 * 2 問進む。
 *
 * @design 通信の失敗は許可して通す（fail-open）
 *
 * 問い合わせが投げたら出題だけを許可する。練習が止まる方が、無料枠を 1 問
 * 多く使われるより損が大きい。以前の残数や特典は引き継がない。
 */
export function createPracticeQuotaGate() {
  const useStore = create<PracticeQuotaStoreState>(() => ({ menus: {} }));

  /** 練習ごとの要求の連番。後から始めた要求の返事だけを採用するために使う */
  const requestSeq: Partial<Record<QuotaMenu, number>> = {};

  function read(menu: QuotaMenu): MenuQuotaState {
    return useStore.getState().menus[menu] ?? IDLE;
  }

  function patch(menu: QuotaMenu, value: Partial<MenuQuotaState>): void {
    useStore.setState((state) => ({
      menus: { ...state.menus, [menu]: { ...read(menu), ...value } },
    }));
  }

  /**
   * 1 問始める。`ask` で枠の消費を聞き、許可されたら `generate` を呼ぶ
   *
   * @param ask - 枠を 1 つ消費する問い合わせ。投げたら確かめられなかった扱い
   * @param generate - 許可されたときに呼ぶ生成処理。返事が届いた時点で呼ぶ
   */
  async function request(
    menu: QuotaMenu,
    ask: () => Promise<QuotaOutcome>,
    generate: () => void,
  ): Promise<void> {
    const seq = (requestSeq[menu] ?? 0) + 1;
    requestSeq[menu] = seq;
    const isCurrent = () => requestSeq[menu] === seq;
    patch(menu, { isChecking: true });

    try {
      let outcome: QuotaOutcome;
      try {
        outcome = await ask();
      } catch (error) {
        if (!isCurrent()) return;
        console.warn(
          "practice quota check failed; allowing the question:",
          error,
        );
        outcome = { kind: "unverified" };
      }
      if (!isCurrent()) return;

      switch (outcome.kind) {
        case "rateLimited":
          patch(menu, { gate: { kind: "rateLimited" } });
          return;
        case "unverified":
          patch(menu, { gate: { kind: "unverified" } });
          generate();
          return;
        case "answer": {
          const { answer } = outcome;
          if (answer.allowed) {
            generate();
            patch(menu, {
              gate: {
                kind: "open",
                remaining: answer.remaining,
                limit: answer.limit,
                benefits: answer.benefits,
              },
            });
          } else {
            patch(menu, {
              gate: {
                kind: "blocked",
                limit: typeof answer.limit === "number" ? answer.limit : 0,
                signedIn: answer.signedIn,
                benefits: answer.benefits,
              },
            });
          }
          return;
        }
        default: {
          const exhaustive: never = outcome;
          return exhaustive;
        }
      }
    } finally {
      if (isCurrent()) patch(menu, { isChecking: false });
    }
  }

  /**
   * 残数と特典を消費せずに取り直し、ゲートに写す
   *
   * 確かめられなかった（`peek` が undefined）ときは今のゲートを保つ。取り直して
   * いる間に新しい出題が始まったら、その返事の方が新しいのでこちらは捨てる
   * （連番は進めない — 出題の要求を追い越す立場にない）。表示している問題は
   * もう許可済みなので、残りが 0 でも `open`（「この問題で最後」）。`blocked` に
   * するのは次の出題を聞いたときだけ。
   */
  async function refresh(
    menu: QuotaMenu,
    peek: () => Promise<BeginPracticeQuestionResult | undefined>,
  ): Promise<void> {
    const seq = requestSeq[menu];
    const answer = await peek();
    if (requestSeq[menu] !== seq || answer === undefined) return;
    patch(menu, {
      gate: {
        kind: "open",
        remaining: answer.remaining,
        limit: answer.limit,
        benefits: answer.benefits,
      },
    });
  }

  /** 前の練習のゲート（ペイウォール等）を消す */
  function clear(menu: QuotaMenu): void {
    patch(menu, { gate: undefined });
  }

  /** 盤面が購読する練習 1 つぶんの状態 */
  function useMenuState(menu: QuotaMenu): MenuQuotaState {
    return useStore((state) => state.menus[menu] ?? IDLE);
  }

  /** テスト用。状態と連番を初期化する */
  function reset(): void {
    useStore.setState({ menus: {} });
    for (const menu of QUOTA_MENUS) {
      delete requestSeq[menu];
    }
  }

  return { useStore, useMenuState, read, request, refresh, clear, reset };
}
