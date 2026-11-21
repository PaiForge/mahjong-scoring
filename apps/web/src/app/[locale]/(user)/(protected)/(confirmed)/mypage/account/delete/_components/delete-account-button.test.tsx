import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { messages } from "@mahjong-scoring/messages/ja";

const { mockDelete, mockSignOut, mockPush, mockToastError } = vi.hoisted(
  () => ({
    mockDelete: vi.fn(),
    mockSignOut: vi.fn(),
    mockPush: vi.fn(),
    mockToastError: vi.fn(),
  }),
);

vi.mock("../_actions/delete-account", () => ({
  deleteOwnAccount: mockDelete,
}));
vi.mock("@/app/_contexts/auth-context", () => ({
  useAuth: () => ({ signOut: mockSignOut }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));
vi.mock("react-hot-toast", () => ({ toast: { error: mockToastError } }));
vi.mock("@/app/_components/_lib/toast-on-arrival", () => ({
  toastOnArrival: vi.fn(),
}));

import { DeleteAccountButton } from "./delete-account-button";

const t = messages.deleteAccount;

/** ボタンを押し、確認のモーダルで確定する */
function confirmDeletion() {
  render(
    <NextIntlClientProvider locale="ja" messages={messages}>
      <DeleteAccountButton />
    </NextIntlClientProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: t.confirmButton }));
  fireEvent.click(screen.getByRole("button", { name: t.confirmOk }));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  mockDelete.mockResolvedValue({ success: true, status: "completed" });
  mockSignOut.mockResolvedValue(undefined);
});

describe("DeleteAccountButton", () => {
  it("受け付けたらログアウトしてトップへ送る", async () => {
    confirmDeletion();

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"));
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it("アクションが投げても「削除中」のまま止めず、失敗を出して押し直せる", async () => {
    mockDelete.mockRejectedValue(new Error("network"));

    confirmDeletion();

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith(t.error));
    expect(
      screen
        .getByRole("button", { name: t.confirmButton })
        .hasAttribute("disabled"),
    ).toBe(false);
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  // 退会は受け付け済みなので、ログアウトの失敗で画面を止めない
  it("ログアウトが失敗しても、退会を受け付けていればトップへ送る", async () => {
    mockSignOut.mockRejectedValue(new Error("auth unreachable"));

    confirmDeletion();

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"));
  });
});
