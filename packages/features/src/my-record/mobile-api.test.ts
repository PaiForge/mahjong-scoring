import { describe, expect, it } from "vitest";

import {
  mobileRecordResultsApiUrl,
  mobileRecordsApiUrl,
  parseMobileRecordResultsResponse,
  parseMobileRecordsResponse,
} from "./mobile-api";

const attempt = (overrides: object = {}) => ({
  id: "a1",
  menuType: "jantou_fu",
  variant: "default",
  score: 12,
  incorrectAnswers: 1,
  createdAt: "2026-10-10T00:00:00.000Z",
  ...overrides,
});

describe("mobileRecordsApiUrl", () => {
  it("土俵と期間をクエリに載せる", () => {
    expect(
      mobileRecordsApiUrl(
        { menuType: "yaku_han", variant: "kuisagari" },
        "lastMonth",
      ),
    ).toBe(
      "/api/mobile/v1/records?menu=yaku_han&variant=kuisagari&period=lastMonth",
    );
  });

  it("土俵を省くと期間だけ", () => {
    expect(mobileRecordsApiUrl(undefined, "thisWeek")).toBe(
      "/api/mobile/v1/records?period=thisWeek",
    );
  });
});

describe("mobileRecordResultsApiUrl", () => {
  it("ページ番号を載せる", () => {
    expect(mobileRecordResultsApiUrl(undefined, 2)).toBe(
      "/api/mobile/v1/records/results?page=2",
    );
  });
});

describe("parseMobileRecordsResponse", () => {
  it("日時を Date にし、知らない土俵は落とす", () => {
    const parsed = parseMobileRecordsResponse({
      boards: [
        { menuType: "jantou_fu", variant: "default" },
        { menuType: "future_practice", variant: "default" },
      ],
      board: { menuType: "jantou_fu", variant: "default" },
      current: [attempt(), attempt({ id: "a2", menuType: "future_practice" })],
      previous: [],
    });

    expect(parsed?.boards).toEqual([
      { menuType: "jantou_fu", variant: "default" },
    ]);
    expect(parsed?.current).toEqual([
      {
        id: "a1",
        menuType: "jantou_fu",
        variant: "default",
        score: 12,
        incorrectAnswers: 1,
        createdAt: new Date("2026-10-10T00:00:00.000Z"),
      },
    ]);
  });

  it("表示する土俵を知らなければ土俵無し・チャレンジ空", () => {
    expect(
      parseMobileRecordsResponse({
        boards: [{ menuType: "jantou_fu", variant: "default" }],
        board: { menuType: "future_practice", variant: "default" },
        current: [attempt({ menuType: "future_practice" })],
        previous: [],
      }),
    ).toEqual({
      boards: [{ menuType: "jantou_fu", variant: "default" }],
      current: [],
      previous: [],
    });
  });

  it("形が違えば undefined", () => {
    expect(parseMobileRecordsResponse({ boards: "x" })).toBe(undefined);
  });
});

describe("parseMobileRecordResultsResponse", () => {
  it("ページ情報とチャレンジを読む", () => {
    expect(
      parseMobileRecordResultsResponse({
        items: [attempt()],
        page: 1,
        totalPages: 3,
      })?.items[0]?.createdAt,
    ).toEqual(new Date("2026-10-10T00:00:00.000Z"));
  });
});
