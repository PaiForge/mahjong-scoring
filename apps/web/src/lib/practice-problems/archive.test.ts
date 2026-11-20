// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createQueryChain, type QueryChainMock } from "@/test/drizzle-mock";

const { mockInsert, mockSelect } = vi.hoisted(() => ({
  mockInsert: vi.fn(),
  mockSelect: vi.fn(),
}));

vi.mock("../db", async () => ({
  ...(await import("../db/schema")),
  db: { insert: mockInsert, select: mockSelect },
}));
vi.mock("../log-error", async () => await import("@/test/log-error-mock"));

import { logExternalError } from "@/test/log-error-mock";
import {
  parsePracticeProblemArchiveRequest,
  type PracticeProblemArchiveRequest,
} from "@mahjong-scoring/core";

import { practiceProblems } from "../db/schema";

import {
  archivePracticeProblem,
  ensurePracticeProblem,
  isPracticeProblemArchiveDisabled,
  PRACTICE_PROBLEM_ARCHIVE_BODY_MAX_BYTES,
} from "./archive";
import {
  allAnkanRiichiAgariRequest,
  allKanAgariRequest,
  meldedAgariRequest,
  riichiTenpaiRequest,
} from "./test-requests";

let chain: QueryChainMock;

/** 保存した行（`insert(...).values(...)` に渡した値） */
function insertedRow(call = 0): Record<string, unknown> {
  return chain.values.mock.calls[call][0];
}

beforeEach(() => {
  vi.clearAllMocks();
  chain = createQueryChain([]);
  mockInsert.mockReturnValue(chain);
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("本文の上限", () => {
  it.each([
    ["副露 4 つすべて槓・リーチなし", allKanAgariRequest],
    ["門前リーチで暗槓 4 つ", allAnkanRiichiAgariRequest],
  ])(
    "最大構成（%s）の要求は 4096 バイト未満の JSON で、検証を通る",
    async (_name, make) => {
      const body = make();

      expect(
        new TextEncoder().encode(JSON.stringify(body)).length,
      ).toBeLessThan(PRACTICE_PROBLEM_ARCHIVE_BODY_MAX_BYTES);
      expect(await archivePracticeProblem(body, "web")).toEqual({ ok: true });
    },
  );
});

describe("archivePracticeProblem", () => {
  it("検証を通った盤面を、サーバーが計算したハッシュと由来を添えて 1 回の INSERT ... ON CONFLICT DO NOTHING で保存する", async () => {
    const result = await archivePracticeProblem(meldedAgariRequest(), "ios");

    expect(result).toEqual({ ok: true });
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsert).toHaveBeenCalledWith(practiceProblems);
    expect(insertedRow()).toEqual({
      kind: "agari-score",
      schemaVersion: 1,
      identityVersion: 1,
      contentHash: expect.stringMatching(/^[0-9a-f]{64}$/),
      payload: expect.objectContaining({ agariHai: 5, isTsumo: true }),
      source: "ios",
    });
    expect(chain.onConflictDoNothing).toHaveBeenCalledWith({
      target: [
        practiceProblems.kind,
        practiceProblems.identityVersion,
        practiceProblems.contentHash,
      ],
    });
  });

  it("鳴き元だけ違う盤面は同じハッシュになり、payload には鳴き元を残す", async () => {
    await archivePracticeProblem(meldedAgariRequest(), "web");
    await archivePracticeProblem(
      meldedAgariRequest({ ponFrom: "toimen" }),
      "web",
    );

    expect(insertedRow(0).contentHash).toBe(insertedRow(1).contentHash);
    expect(JSON.stringify(insertedRow(1).payload)).toContain('"toimen"');
  });

  it("副露の種別が違う盤面は別のハッシュになる", async () => {
    await archivePracticeProblem(meldedAgariRequest(), "web");
    await archivePracticeProblem(
      meldedAgariRequest({ ninePinKan: "kakan" }),
      "web",
    );

    expect(insertedRow(0).contentHash).not.toBe(insertedRow(1).contentHash);
  });

  it("聴牌形も保存する", async () => {
    expect(
      await archivePracticeProblem(riichiTenpaiRequest(), "android"),
    ).toEqual({ ok: true });
    expect(insertedRow()).toMatchObject({
      kind: "tenpai-score",
      source: "android",
    });
  });

  it.each([
    ["形が違う", { kind: "agari-score" }, "malformed"],
    [
      "未知の種別",
      { kind: "yaku-han", schemaVersion: 1, payload: {} },
      "unknownKind",
    ],
    [
      "未知の版",
      { kind: "agari-score", schemaVersion: 2, payload: {} },
      "unsupportedSchemaVersion",
    ],
  ])(
    "検証を通らない要求（%s）は保存せず理由を返し、警告にはエラーコードだけを出す",
    async (_name, body, reason) => {
      const result = await archivePracticeProblem(body, "web");

      expect(result).toEqual({ ok: false, error: { type: "invalid", reason } });
      expect(mockInsert).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining(reason),
      );
      expect(console.warn).not.toHaveBeenCalledWith(
        expect.stringContaining("payload"),
      );
    },
  );

  it("DB の失敗は saveFailed を返し、盤面を含む例外のメッセージではなくエラーコードだけを記録する", async () => {
    const cause = Object.assign(new Error("check violation"), {
      code: "23514",
    });
    chain.onConflictDoNothing.mockRejectedValue(
      Object.assign(new Error('Failed query: insert ... params: {"hand":1}'), {
        cause,
      }),
    );

    const result = await archivePracticeProblem(meldedAgariRequest(), "web");

    expect(result).toEqual({ ok: false, error: { type: "saveFailed" } });
    expect(logExternalError).toHaveBeenCalledWith(
      "archivePracticeProblem",
      expect.any(String),
      "23514",
    );
  });
});

/** 検証を通した盤面（{@link ensurePracticeProblem} は検証済みのものを受け取る） */
function parsedRequest(body: unknown): PracticeProblemArchiveRequest {
  const parsed = parsePracticeProblemArchiveRequest(body);
  if (parsed.isErr()) throw new Error(parsed.error);
  return parsed.value;
}

describe("ensurePracticeProblem", () => {
  it("出題時の保存と同じ行を 1 回の INSERT ... ON CONFLICT DO NOTHING RETURNING で入れ、入った行の ID を返す", async () => {
    await archivePracticeProblem(meldedAgariRequest(), "web");
    const archived = insertedRow();
    chain = createQueryChain([{ id: "problem-1" }]);
    mockInsert.mockReturnValue(chain);

    const id = await ensurePracticeProblem(
      parsedRequest(meldedAgariRequest()),
      "web",
    );

    expect(id).toBe("problem-1");
    expect(insertedRow()).toEqual(archived);
    expect(chain.onConflictDoNothing).toHaveBeenCalledWith({
      target: [
        practiceProblems.kind,
        practiceProblems.identityVersion,
        practiceProblems.contentHash,
      ],
    });
    expect(chain.returning).toHaveBeenCalledWith({ id: practiceProblems.id });
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it("同じ盤面が既にあれば、一意制約の列で読み直して既存の行の ID を返す", async () => {
    mockInsert.mockReturnValue(createQueryChain([]));
    const selected = createQueryChain([{ id: "existing" }]);
    mockSelect.mockReturnValue(selected);

    const id = await ensurePracticeProblem(
      parsedRequest(riichiTenpaiRequest()),
      "ios",
    );

    expect(id).toBe("existing");
    expect(selected.from).toHaveBeenCalledWith(practiceProblems);
    expect(selected.where).toHaveBeenCalledTimes(1);
  });

  it("停止スイッチが立っていても保存する（報告は盤面が無いと調べられない）", async () => {
    vi.stubEnv("PRACTICE_PROBLEM_ARCHIVE_DISABLED", "1");
    chain = createQueryChain([{ id: "problem-1" }]);
    mockInsert.mockReturnValue(chain);

    expect(
      await ensurePracticeProblem(parsedRequest(meldedAgariRequest()), "web"),
    ).toBe("problem-1");
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it("DB の失敗は例外のまま呼び出し側へ投げる", async () => {
    chain.returning.mockRejectedValue(new Error("connection lost"));

    await expect(
      ensurePracticeProblem(parsedRequest(meldedAgariRequest()), "web"),
    ).rejects.toThrow("connection lost");
  });
});

describe("isPracticeProblemArchiveDisabled", () => {
  it("PRACTICE_PROBLEM_ARCHIVE_DISABLED が 1 のときだけ止める", () => {
    vi.stubEnv("PRACTICE_PROBLEM_ARCHIVE_DISABLED", "1");
    expect(isPracticeProblemArchiveDisabled()).toBe(true);
    vi.stubEnv("PRACTICE_PROBLEM_ARCHIVE_DISABLED", "true");
    expect(isPracticeProblemArchiveDisabled()).toBe(false);
    vi.stubEnv("PRACTICE_PROBLEM_ARCHIVE_DISABLED", "");
    expect(isPracticeProblemArchiveDisabled()).toBe(false);
  });
});
