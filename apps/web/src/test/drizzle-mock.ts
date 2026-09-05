import { vi, type Mock } from "vitest";

/**
 * Drizzle のメソッドチェーンを模したテスト用モック
 * Drizzleチェーンモック
 *
 * `db.select().from().where().limit()` のような連鎖を、どのメソッド名でも
 * 自分自身を返す形で受け止める。各メソッドは名前ごとに記憶された `vi.fn` なので
 * `expect(chain.where).toHaveBeenCalledWith(...)` のように検証できる。
 *
 * このモジュールはテスト専用。アプリ本体から import しないこと。
 */
export interface QueryChainMock {
  /** 呼び出されたメソッドは同名の vi.fn として参照できる */
  readonly [method: string]: Mock;
}

/**
 * チェーンモックを作る
 * チェーンモック生成
 *
 * @param resolveValue - `await chain` で解決させたい値。
 *   省略すると thenable にならないため、終端のメソッドに
 *   `chain.where.mockResolvedValue(rows)` のように個別指定する。
 */
export function createQueryChain(resolveValue?: unknown): QueryChainMock {
  const methods = new Map<string, Mock>();

  const chain: unknown = new Proxy(
    {},
    {
      get(_target, prop) {
        // resolveValue 未指定なら thenable にしない（await でチェーン自身が返る）
        if (prop === "then") {
          if (resolveValue === undefined) return undefined;
          return (resolve: (value: unknown) => void) => resolve(resolveValue);
        }
        if (typeof prop !== "string") return undefined;

        const existing = methods.get(prop);
        if (existing) return existing;

        const fn = vi.fn(() => chain);
        methods.set(prop, fn);
        return fn;
      },
    },
  );

  return chain as QueryChainMock;
}

/** 呼び出し順に結果を返す `db.select()` のテスト用制御器 */
export interface SelectSequenceMock {
  /** `db.select` に設定する関数 */
  readonly select: (...args: unknown[]) => QueryChainMock;
  /** 呼び出された順に作られたチェーン */
  readonly chains: readonly QueryChainMock[];
  /** 次のテストで返す結果列を設定し、呼び出し履歴を初期化する */
  setResults(...results: unknown[][]): void;
}

/**
 * 呼び出し順に異なる結果を返す `db.select()` モックを作る。
 *
 * 一覧と件数、今回・ベスト・前回など、1つの処理が複数の select を発行する
 * クエリのテストで使う。結果列を使い切った後は空配列を返す。
 */
export function createSelectSequenceMock(): SelectSequenceMock {
  let callIndex = 0;
  let returnValues: unknown[][] = [];
  let chains: QueryChainMock[] = [];

  return {
    select: (..._args: unknown[]) => {
      const resolveValue = returnValues[callIndex++] ?? [];
      const chain = createQueryChain(resolveValue);
      chains.push(chain);
      return chain;
    },
    get chains() {
      return chains;
    },
    setResults(...results) {
      callIndex = 0;
      returnValues = results;
      chains = [];
    },
  };
}
