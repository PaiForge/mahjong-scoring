/**
 * パスワード再設定 Server Action のテスト
 *
 * @description
 * - 成功: Google / Apple だけで登録した人にも `email` の連携を補う
 *   （`ensureEmailIdentity` に更新後の user の値を渡す）
 * - 更新に失敗した・メールアドレスが無い: 補わない
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const {
  mockEnforceIpRateLimit,
  mockUpdateUser,
  mockEnsureEmailIdentity,
  mockLogActivityEvent,
} = vi.hoisted(() => ({
  mockEnforceIpRateLimit: vi.fn(),
  mockUpdateUser: vi.fn(),
  mockEnsureEmailIdentity: vi.fn(),
  mockLogActivityEvent: vi.fn(),
}));

vi.mock("@/lib/rate-limit-ip", () => ({
  enforceIpRateLimit: mockEnforceIpRateLimit,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { updateUser: mockUpdateUser } }),
}));
vi.mock("@/lib/users/login-methods", () => ({
  ensureEmailIdentity: mockEnsureEmailIdentity,
}));
vi.mock("@/lib/activity-log", () => ({
  logActivityEvent: mockLogActivityEvent,
}));

import { resetPassword } from "../reset-password";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PASSWORD = "newpass1";
const USER_ID = "user-1";
const EMAIL = "user@example.com";

function updatedUser(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      user: {
        id: USER_ID,
        email: EMAIL,
        identities: [{ provider: "google" }],
        ...overrides,
      },
    },
    error: null,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockEnforceIpRateLimit.mockResolvedValue(undefined);
  mockEnsureEmailIdentity.mockResolvedValue(undefined);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("resetPassword", () => {
  it("更新に成功したら、更新後の user の値で email の連携を補う", async () => {
    mockUpdateUser.mockResolvedValue(updatedUser());

    const result = await resetPassword(PASSWORD);

    expect(result).toEqual({ success: true });
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: PASSWORD });
    expect(mockEnsureEmailIdentity).toHaveBeenCalledWith(USER_ID, EMAIL, [
      { provider: "google" },
    ]);
    expect(mockLogActivityEvent).toHaveBeenCalledWith({
      userId: USER_ID,
      action: "change_password",
    });
  });

  it("identities が無い user なら空の一覧を渡す", async () => {
    mockUpdateUser.mockResolvedValue(updatedUser({ identities: undefined }));

    await resetPassword(PASSWORD);

    expect(mockEnsureEmailIdentity).toHaveBeenCalledWith(USER_ID, EMAIL, []);
  });

  it("更新に失敗したら連携を補わない", async () => {
    mockUpdateUser.mockResolvedValue({
      data: { user: null },
      error: { message: "failed" },
    });

    const result = await resetPassword(PASSWORD);

    expect(result).toEqual({ error: "updateFailed" });
    expect(mockEnsureEmailIdentity).not.toHaveBeenCalled();
    expect(mockLogActivityEvent).not.toHaveBeenCalled();
  });

  it("メールアドレスの無い user なら連携を補わない", async () => {
    mockUpdateUser.mockResolvedValue(updatedUser({ email: undefined }));

    const result = await resetPassword(PASSWORD);

    expect(result).toEqual({ success: true });
    expect(mockEnsureEmailIdentity).not.toHaveBeenCalled();
  });

  it("パスワードが規則に合わなければ更新しない", async () => {
    const result = await resetPassword("short");

    expect(result).toEqual({ error: expect.stringMatching(/^password:/) });
    expect(mockUpdateUser).not.toHaveBeenCalled();
    expect(mockEnsureEmailIdentity).not.toHaveBeenCalled();
  });
});
