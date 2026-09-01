/**
 * AvatarUpload の削除フローテスト
 *
 * @description
 * - アバター未設定: バツ印を出さない
 * - キャンセル: API を呼ばない
 * - 成功時: 初期アイコンへ戻し、ヘッダー用のプロフィールも再取得する
 * - 失敗時: 画像を残したままエラーを出す
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mocks (hoisted)
// ---------------------------------------------------------------------------

const { mockCallApi, mockRefreshProfile, mockToastSuccess } = vi.hoisted(
  () => ({
    mockCallApi: vi.fn(),
    mockRefreshProfile: vi.fn(),
    mockToastSuccess: vi.fn(),
  }),
);

vi.mock("@/lib/api-client", async () => ({
  ...(await vi.importActual<typeof import("@/lib/api-client")>(
    "@/lib/api-client",
  )),
  callApi: mockCallApi,
}));

vi.mock("@/app/_contexts/auth-context", () => ({
  useAuth: () => ({ refreshProfile: mockRefreshProfile }),
}));

vi.mock("next-intl", async () => await import("@/test/intl-mock"));

vi.mock("react-hot-toast", () => ({
  default: { success: mockToastSuccess, error: vi.fn() },
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { readonly src: string; readonly alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

import { AvatarUpload } from "./avatar-upload";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const AVATAR_URL = "https://example.test/avatars/user-1/avatar.webp";

/**
 * ボタンを label（i18n キー）で取得する。
 * useTranslations のモックが key をそのまま返すため、label = key でマッチできる。
 */
/** ConfirmationModal は body へポータルされるため、探索先に document.body を渡す。 */
function getButton(root: HTMLElement, label: string) {
  return Array.from(root.querySelectorAll("button")).find(
    (b) => b.textContent?.trim() === label,
  );
}

/** アバターに重ねたバツ印（ラベルしか持たないため aria-label で引く） */
function getRemoveButton(container: HTMLElement) {
  return container.querySelector<HTMLButtonElement>(
    'button[aria-label="avatarRemove"]',
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AvatarUpload の削除", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("アバター未設定のときはバツ印を出さない", () => {
    const { container } = render(<AvatarUpload currentAvatarUrl={null} />);

    expect(getRemoveButton(container)).toBeNull();
  });

  it("確認モーダルをキャンセルすると API を呼ばない", () => {
    const { container } = render(
      <AvatarUpload currentAvatarUrl={AVATAR_URL} />,
    );

    fireEvent.click(getRemoveButton(container)!);
    fireEvent.click(getButton(document.body, "avatarRemoveConfirmCancel")!);

    expect(mockCallApi).not.toHaveBeenCalled();
    expect(container.querySelector("img")).not.toBeNull();
  });

  it("確認すると DELETE を呼び、初期アイコンへ戻す", async () => {
    mockCallApi.mockResolvedValue({ ok: true, data: { success: true } });

    const { container } = render(
      <AvatarUpload currentAvatarUrl={AVATAR_URL} />,
    );

    fireEvent.click(getRemoveButton(container)!);
    await act(async () => {
      fireEvent.click(getButton(document.body, "avatarRemoveConfirmOk")!);
    });

    expect(mockCallApi).toHaveBeenCalledWith("/api/profile/avatar", {
      method: "DELETE",
    });
    expect(container.querySelector("img")).toBeNull();
    expect(getRemoveButton(container)).toBeNull();
    expect(mockRefreshProfile).toHaveBeenCalled();
    expect(mockToastSuccess).toHaveBeenCalledWith("avatarRemoved");
  });

  it("失敗したときは画像を残したままエラーを出す", async () => {
    mockCallApi.mockResolvedValue({ ok: false, error: "unknown" });

    const { container } = render(
      <AvatarUpload currentAvatarUrl={AVATAR_URL} />,
    );

    fireEvent.click(getRemoveButton(container)!);
    await act(async () => {
      fireEvent.click(getButton(document.body, "avatarRemoveConfirmOk")!);
    });

    expect(container.textContent).toContain("avatarRemoveFailed");
    expect(container.querySelector("img")).not.toBeNull();
    expect(mockRefreshProfile).not.toHaveBeenCalled();
  });

  it("レートリミット時は専用のメッセージを出す", async () => {
    mockCallApi.mockResolvedValue({ ok: false, error: "rateLimited" });

    const { container } = render(
      <AvatarUpload currentAvatarUrl={AVATAR_URL} />,
    );

    fireEvent.click(getRemoveButton(container)!);
    await act(async () => {
      fireEvent.click(getButton(document.body, "avatarRemoveConfirmOk")!);
    });

    expect(container.textContent).toContain("rateLimited");
  });
});
