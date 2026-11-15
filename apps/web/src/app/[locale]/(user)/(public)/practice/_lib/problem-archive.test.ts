import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  agariArchiveRequestOf,
  tenpaiArchiveRequestOf,
} from "@mahjong-scoring/features/practice/archive/archive-request";
import { PRACTICE_PROBLEMS_API_PATH } from "@mahjong-scoring/features/practice/archive/mobile-api";

/** 回答の判定モード（点数だけを答える既定） */
const SCORE_ONLY_MODE = {
  requireYaku: false,
  requireHanFu: false,
  exactHan: false,
  requireFuForMangan: false,
} as const;

/** 送り直しの待ち（最大 1000ms）と 1 試行の打ち切り（5000ms）を十分に越える時間 */
const LONGER_THAN_RETRY_MS = 20_000;

const fetchMock = vi.fn<typeof fetch>();

/**
 * ストアを新しく読み込む。送信キューはモジュールスコープに 1 つなので、
 * テストごとに読み直して前のテストの送信中・待ちを持ち越さない
 */
async function loadAgariStore() {
  vi.resetModules();
  return (await import("../agari-score/_hooks/use-agari-score-store"))
    .useAgariScoreStore;
}

async function loadTenpaiStore() {
  vi.resetModules();
  return (await import("../tenpai-score/_hooks/use-tenpai-score-store"))
    .useTenpaiScoreStore;
}

beforeEach(() => {
  vi.useFakeTimers();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("和了形の点数計算のストアからの保存", () => {
  it("問題を生成できたら保存 API へ POST で 1 回送る", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const store = await loadAgariStore();

    store.getState().generateNewQuestion();

    const question = store.getState().currentQuestion;
    if (question === undefined) throw new Error("問題を生成できなかった");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [path, init] = fetchMock.mock.calls[0] ?? [];
    expect(path).toBe(PRACTICE_PROBLEMS_API_PATH);
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({ "content-type": "application/json" });
    expect(JSON.parse(String(init?.body))).toEqual(
      JSON.parse(JSON.stringify(agariArchiveRequestOf(question))),
    );
  });

  it.each([
    ["解決しない", () => new Promise<Response>(() => {})],
    ["拒否する", () => Promise.reject(new TypeError("network"))],
    ["500 を返す", () => Promise.resolve(new Response(null, { status: 500 }))],
  ])(
    "fetch が%s状態でも生成と回答は同期に終わり、続けて次の問題を作れる",
    async (_, respond) => {
      fetchMock.mockImplementation(respond);
      const store = await loadAgariStore();

      store.getState().generateNewQuestion();
      expect(store.getState().currentQuestion).toBeDefined();
      store
        .getState()
        .submitAnswer(
          { han: 1, fu: 30, score: 1000, yakus: [] },
          SCORE_ONLY_MODE,
        );
      expect(store.getState().isAnswered).toBe(true);
      expect(store.getState().stats.total).toBe(1);

      const first = store.getState().currentQuestion;
      store.getState().generateNewQuestion();
      expect(store.getState().currentQuestion).toBeDefined();
      expect(store.getState().currentQuestion).not.toBe(first);
      expect(store.getState().isAnswered).toBe(false);
    },
  );

  it("401（未ログイン）は送り直さない", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }));
    const store = await loadAgariStore();

    store.getState().generateNewQuestion();
    await vi.advanceTimersByTimeAsync(LONGER_THAN_RETRY_MS);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("500 は 1 回だけ送り直す", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));
    const store = await loadAgariStore();

    store.getState().generateNewQuestion();
    await vi.advanceTimersByTimeAsync(LONGER_THAN_RETRY_MS);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("聴牌形の点数計算のストアからの保存", () => {
  it("問題を生成できたら保存 API へ POST で 1 回送る", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const store = await loadTenpaiStore();

    store.getState().generateNewQuestion();

    const question = store.getState().currentQuestion;
    if (question === undefined) throw new Error("問題を生成できなかった");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [path, init] = fetchMock.mock.calls[0] ?? [];
    expect(path).toBe(PRACTICE_PROBLEMS_API_PATH);
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual(
      JSON.parse(JSON.stringify(tenpaiArchiveRequestOf(question))),
    );
  });

  it("fetch が解決しない状態でも生成と待ちの判定は同期に終わり、続けて次の問題を作れる", async () => {
    fetchMock.mockImplementation(() => new Promise<Response>(() => {}));
    const store = await loadTenpaiStore();

    store.getState().generateNewQuestion();
    expect(store.getState().currentQuestion).toBeDefined();
    store.getState().submitMachi();
    expect(store.getState().machiJudgement).toBeDefined();

    store.getState().generateNewQuestion();
    expect(store.getState().currentQuestion).toBeDefined();
    expect(store.getState().machiJudgement).toBeUndefined();
  });

  it("401（未ログイン）は送り直さない", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }));
    const store = await loadTenpaiStore();

    store.getState().generateNewQuestion();
    await vi.advanceTimersByTimeAsync(LONGER_THAN_RETRY_MS);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
