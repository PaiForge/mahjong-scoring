import { describe, expect, it } from "vitest";

import {
  MOBILE_NOTIFICATIONS_READ_API_PATH,
  mobileNotificationsApiUrl,
  parseMobileNotificationsResponse,
} from "./mobile-api";

const ITEM = {
  id: "11111111-1111-4111-8111-111111111111",
  type: "purchase_completed",
  metadata: { kind: "pass", expiresAt: "2026-10-31T03:00:00.000Z" },
  createdAt: "2026-10-01T03:00:00.000Z",
};

const READ_ITEM = {
  ...ITEM,
  id: "22222222-2222-4222-8222-222222222222",
  type: "plan_expired",
  metadata: {},
  readAt: "2026-10-02T03:00:00.000Z",
};

describe("mobileNotificationsApiUrl", () => {
  it("ページ番号をクエリに載せる", () => {
    expect(mobileNotificationsApiUrl(2)).toBe(
      "/api/mobile/v1/notifications?page=2",
    );
  });
});

describe("MOBILE_NOTIFICATIONS_READ_API_PATH", () => {
  it("既読にする API は一覧の API の下の read", () => {
    expect(MOBILE_NOTIFICATIONS_READ_API_PATH).toBe(
      "/api/mobile/v1/notifications/read",
    );
  });
});

describe("parseMobileNotificationsResponse", () => {
  it("日時はタイムゾーンのずれ付きの ISO 日時も読む", () => {
    const body = {
      items: [
        {
          ...READ_ITEM,
          readAt: "2026-10-02T12:00:00+09:00",
          createdAt: "2026-10-01T12:00:00+09:00",
        },
      ],
      page: 1,
      totalPages: 1,
      unreadCount: 0,
    };
    expect(parseMobileNotificationsResponse(body)).toEqual(body);
  });

  it("未読（readAt なし）と既読の行を読む", () => {
    const body = {
      items: [ITEM, READ_ITEM],
      page: 1,
      totalPages: 1,
      unreadCount: 1,
    };
    expect(parseMobileNotificationsResponse(body)).toEqual(body);
  });

  it("知らない種別もそのまま残す（文面は汎用に落ちる）", () => {
    expect(
      parseMobileNotificationsResponse({
        items: [{ ...ITEM, type: "follow", metadata: {} }],
        page: 1,
        totalPages: 1,
        unreadCount: 1,
      })?.items[0]?.type,
    ).toBe("follow");
  });

  it("届いた日時が日時でなければ undefined", () => {
    expect(
      parseMobileNotificationsResponse({
        items: [{ ...ITEM, createdAt: "昨日" }],
        page: 1,
        totalPages: 1,
        unreadCount: 0,
      }),
    ).toBeUndefined();
  });

  it("未読数が無ければ undefined", () => {
    expect(
      parseMobileNotificationsResponse({ items: [], page: 1, totalPages: 1 }),
    ).toBeUndefined();
  });
});
