import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_RULE_SETTINGS } from "@mahjong-scoring/core";
import {
  agariArchiveRequestOf,
  tenpaiArchiveRequestOf,
} from "@mahjong-scoring/features/practice/archive/archive-request";
import { MOBILE_PRACTICE_PROBLEMS_API_PATH } from "@mahjong-scoring/features/practice/archive/mobile-api";
import { createAgariScoreStore } from "@mahjong-scoring/features/practice/score/use-agari-score-store";
import { createTenpaiScoreStore } from "@mahjong-scoring/features/practice/tenpai-score/use-tenpai-score-store";

const mocks = vi.hoisted(() => ({ callMobileApi: vi.fn() }));

// api-client は React Native を読むので、使う関数だけを置き換える
vi.mock("../../auth/api-client", async () => ({
  ...(await import("../../test/api-client-mock")).apiClientMock,
  callMobileApi: mocks.callMobileApi,
}));

/** 送り直しの待ち（最大 1000ms）と 1 試行の打ち切り（5000ms）を十分に越える時間 */
const LONGER_THAN_RETRY_MS = 20_000;

/**
 * 送信のモジュールを新しく読み込む。送信キューはモジュールスコープに 1 つ
 * なので、テストごとに読み直して前のテストの送信中・待ちを持ち越さない
 *
 * アプリのストアのファイルは端末の設定ストア（AsyncStorage）を読むため
 * Node では読めない。同じファクトリに同じ送信の関数を渡して組み立てる。
 */
async function loadStores() {
  vi.resetModules();
  const { archiveAgariQuestion, archiveTenpaiQuestion } =
    await import("./problem-archive");
  return {
    agari: createAgariScoreStore(
      () => DEFAULT_RULE_SETTINGS,
      archiveAgariQuestion,
    ),
    tenpai: createTenpaiScoreStore(
      () => DEFAULT_RULE_SETTINGS,
      archiveTenpaiQuestion,
    ),
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  mocks.callMobileApi.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("アプリの問題の保存", () => {
  it("和了形の問題を生成できたら保存 API へ POST で 1 回送る", async () => {
    mocks.callMobileApi.mockResolvedValue(new Response(null, { status: 204 }));
    const { agari } = await loadStores();

    agari.getState().generateNewQuestion();

    const question = agari.getState().currentQuestion;
    if (question === undefined) throw new Error("問題を生成できなかった");
    expect(mocks.callMobileApi).toHaveBeenCalledTimes(1);
    expect(mocks.callMobileApi).toHaveBeenCalledWith(
      MOBILE_PRACTICE_PROBLEMS_API_PATH,
      {
        method: "POST",
        body: agariArchiveRequestOf(question),
        signal: expect.any(AbortSignal),
        retryUnauthorized: false,
      },
    );
  });

  it("聴牌形の問題を生成できたら保存 API へ POST で 1 回送る", async () => {
    mocks.callMobileApi.mockResolvedValue(new Response(null, { status: 204 }));
    const { tenpai } = await loadStores();

    tenpai.getState().generateNewQuestion();

    const question = tenpai.getState().currentQuestion;
    if (question === undefined) throw new Error("問題を生成できなかった");
    expect(mocks.callMobileApi).toHaveBeenCalledTimes(1);
    expect(mocks.callMobileApi).toHaveBeenCalledWith(
      MOBILE_PRACTICE_PROBLEMS_API_PATH,
      {
        method: "POST",
        body: tenpaiArchiveRequestOf(question),
        signal: expect.any(AbortSignal),
        retryUnauthorized: false,
      },
    );
  });

  it("通信できなかった（network）ときは 1 回だけ送り直す", async () => {
    mocks.callMobileApi.mockResolvedValue("network");
    const { agari } = await loadStores();

    agari.getState().generateNewQuestion();
    await vi.advanceTimersByTimeAsync(LONGER_THAN_RETRY_MS);

    expect(mocks.callMobileApi).toHaveBeenCalledTimes(2);
  });

  it("5xx の応答は 1 回だけ送り直す", async () => {
    mocks.callMobileApi.mockResolvedValue(new Response(null, { status: 503 }));
    const { agari } = await loadStores();

    agari.getState().generateNewQuestion();
    await vi.advanceTimersByTimeAsync(LONGER_THAN_RETRY_MS);

    expect(mocks.callMobileApi).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["unauthorized（未ログイン）", () => "unauthorized"],
    ["userChanged", () => "userChanged"],
    ["401 の応答", () => new Response(null, { status: 401 })],
    ["429 の応答", () => new Response(null, { status: 429 })],
  ])("%s は送り直さない", async (_, result) => {
    mocks.callMobileApi.mockImplementation(async () => result());
    const { tenpai } = await loadStores();

    tenpai.getState().generateNewQuestion();
    await vi.advanceTimersByTimeAsync(LONGER_THAN_RETRY_MS);

    expect(mocks.callMobileApi).toHaveBeenCalledTimes(1);
  });

  it("送信が終わらなくても生成は同期に終わり、続けて次の問題を作れる", async () => {
    mocks.callMobileApi.mockImplementation(() => new Promise(() => {}));
    const { agari } = await loadStores();

    agari.getState().generateNewQuestion();
    const first = agari.getState().currentQuestion;
    expect(first).toBeDefined();
    agari.getState().generateNewQuestion();

    expect(agari.getState().currentQuestion).toBeDefined();
    expect(agari.getState().currentQuestion).not.toBe(first);
    await vi.advanceTimersByTimeAsync(LONGER_THAN_RETRY_MS);
    const signal = mocks.callMobileApi.mock.calls[0][1].signal;
    expect(signal.aborted).toBe(true);
    expect(mocks.callMobileApi).toHaveBeenCalledTimes(1);
  });
});
