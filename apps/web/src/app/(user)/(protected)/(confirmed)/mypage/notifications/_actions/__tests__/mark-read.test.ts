import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGuard, mockMarkOne, mockMarkAll } = vi.hoisted(() => ({
  mockGuard: vi.fn(),
  mockMarkOne: vi.fn(),
  mockMarkAll: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/action-guard", () => ({ guardUserAction: mockGuard }));
vi.mock("@/lib/notifications/queries", () => ({
  markNotificationRead: mockMarkOne,
  markAllNotificationsRead: mockMarkAll,
}));

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "../mark-read";

const ID = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  mockGuard.mockResolvedValue({ user: { id: "u1" } });
  mockMarkOne.mockResolvedValue(undefined);
  mockMarkAll.mockResolvedValue(undefined);
});

describe("markNotificationReadAction", () => {
  it("UUID でない id はガードより前に弾く", async () => {
    expect(await markNotificationReadAction("n1")).toEqual({
      error: "invalidId",
    });
    expect(mockGuard).not.toHaveBeenCalled();
  });

  it("ガードのエラー（未認証・BAN・レート制限）をそのまま返す", async () => {
    mockGuard.mockResolvedValue({ error: "unauthorized" });
    expect(await markNotificationReadAction(ID)).toEqual({
      error: "unauthorized",
    });
    expect(mockMarkOne).not.toHaveBeenCalled();
  });

  it("本人のユーザー ID で既読にする", async () => {
    expect(await markNotificationReadAction(ID)).toEqual({ success: true });
    expect(mockGuard).toHaveBeenCalledWith("markNotificationsRead");
    expect(mockMarkOne).toHaveBeenCalledWith("u1", ID);
  });

  it("DB が失敗したら markFailed でログを残す", async () => {
    mockMarkOne.mockRejectedValue(new Error("down"));
    expect(await markNotificationReadAction(ID)).toEqual({
      error: "markFailed",
    });
    expect(console.error).toHaveBeenCalled();
  });
});

describe("markAllNotificationsReadAction", () => {
  it("本人の未読をすべて既読にする", async () => {
    expect(await markAllNotificationsReadAction()).toEqual({ success: true });
    expect(mockMarkAll).toHaveBeenCalledWith("u1");
  });

  it("ガードのエラーをそのまま返す", async () => {
    mockGuard.mockResolvedValue({ error: "banned" });
    expect(await markAllNotificationsReadAction()).toEqual({
      error: "banned",
    });
    expect(mockMarkAll).not.toHaveBeenCalled();
  });
});
