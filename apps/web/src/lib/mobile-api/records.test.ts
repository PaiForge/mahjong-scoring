import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuthorize, mockBoards, mockAttempts, mockResults } = vi.hoisted(
  () => ({
    mockAuthorize: vi.fn(),
    mockBoards: vi.fn(),
    mockAttempts: vi.fn(),
    mockResults: vi.fn(),
  }),
);

vi.mock("./auth", () => ({ authorizeMobileRequest: mockAuthorize }));
vi.mock(
  "@/app/(user)/(protected)/(confirmed)/mypage/challenges/_lib/queries",
  () => ({
    fetchAvailableBoards: mockBoards,
    fetchChallengeAttempts: mockAttempts,
    getChallengeResultsPaginated: mockResults,
  }),
);
vi.mock("./mypage", async () => {
  const { mobileJson } = await import("./response");
  return {
    usernameRequired: () =>
      mobileJson({ error: "usernameRequired" }, { status: 409 }),
  };
});
vi.mock("../log-error", () => ({ logExternalError: vi.fn() }));

import { handleReadRecordResults, handleReadRecords } from "./records";

const JANTOU = { menuType: "jantou_fu", variant: "default" };
const YAKU = { menuType: "yaku_han", variant: "kuisagari" };

const get = (query: string) =>
  new Request(`https://example.test/api/mobile/v1/records${query}`);

const attempt = {
  id: "a1",
  ...JANTOU,
  score: 12,
  incorrectAnswers: 1,
  createdAt: new Date("2026-10-09T15:00:00.000Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
  // JST の 2026-10-10（土）09:00
  vi.useFakeTimers({ now: new Date("2026-10-10T09:00:00+09:00") });
  mockAuthorize.mockResolvedValue({
    ok: true,
    user: { id: "user-1" },
    profile: { username: "bob" },
  });
  mockBoards.mockResolvedValue([JANTOU, YAKU]);
  mockAttempts.mockResolvedValue({ current: [attempt], previous: [] });
  mockResults.mockResolvedValue({ items: [attempt], totalPages: 2 });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("handleReadRecords", () => {
  it("要求した土俵と期間（JST の週）で引き、日時を ISO 文字列で返す", async () => {
    const response = await handleReadRecords(
      get("?menu=yaku_han&variant=kuisagari&period=thisWeek"),
    );

    expect(mockAttempts).toHaveBeenCalledWith(
      "user-1",
      YAKU,
      new Date("2026-10-05T00:00:00+09:00"),
      new Date("2026-10-12T00:00:00+09:00"),
      new Date("2026-09-28T00:00:00+09:00"),
      new Date("2026-10-05T00:00:00+09:00"),
    );
    expect(await response.json()).toEqual({
      boards: [JANTOU, YAKU],
      board: YAKU,
      current: [{ ...attempt, createdAt: "2026-10-09T15:00:00.000Z" }],
      previous: [],
    });
  });

  it("記録の無い土俵・試験・不正な期間は先頭の土俵と今週に落とす", async () => {
    await handleReadRecords(get("?menu=score_exam&period=forever"));

    expect(mockAttempts).toHaveBeenCalledWith(
      "user-1",
      JANTOU,
      new Date("2026-10-05T00:00:00+09:00"),
      new Date("2026-10-12T00:00:00+09:00"),
      expect.any(Date),
      expect.any(Date),
    );
  });

  it("記録が 1 件も無ければ土俵無しで、チャレンジを引かない", async () => {
    mockBoards.mockResolvedValue([]);

    const body = await (await handleReadRecords(get(""))).json();

    expect(body).toEqual({ boards: [], current: [], previous: [] });
    expect(mockAttempts).not.toHaveBeenCalled();
  });

  it("ユーザー名を決める前は 409", async () => {
    mockAuthorize.mockResolvedValue({
      ok: true,
      user: { id: "user-1" },
      profile: undefined,
    });

    expect((await handleReadRecords(get(""))).status).toBe(409);
    expect(mockBoards).not.toHaveBeenCalled();
  });

  it("読み取りに失敗したら 500", async () => {
    mockBoards.mockRejectedValue(new Error("db down"));

    expect((await handleReadRecords(get(""))).status).toBe(500);
  });
});

describe("handleReadRecordResults", () => {
  it("土俵とページで引き、範囲外のページは最後に丸める", async () => {
    const response = await handleReadRecordResults(
      get("/results?menu=jantou_fu&page=9"),
    );

    expect(mockResults).toHaveBeenCalledWith("user-1", 9, JANTOU);
    expect(await response.json()).toEqual({
      items: [{ ...attempt, createdAt: "2026-10-09T15:00:00.000Z" }],
      page: 2,
      totalPages: 2,
    });
  });

  it("土俵の指定が無ければ絞り込まない", async () => {
    await handleReadRecordResults(get("/results"));

    expect(mockResults).toHaveBeenCalledWith("user-1", 1, undefined);
  });
});
