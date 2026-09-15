/**
 * ExamRecordNotice の出し分けテスト
 *
 * @description
 * - 未ログイン: 道場と同じ文言（signInNote / signInLink）で記録されないことを伝える
 * - 認証状態の解決中: 何も出さない（確定前に「記録されない」と誤って伝えない）
 * - ログイン済み: 何も出さない
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const { mockUseAuth } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
}));

vi.mock("@/app/_contexts/auth-context", () => ({ useAuth: mockUseAuth }));

vi.mock("next-intl", async () => await import("@/test/intl-mock"));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    readonly children: React.ReactNode;
    readonly href: string;
    readonly className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import { ExamRecordNotice } from "./exam-record-notice";

describe("ExamRecordNotice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("未ログインなら道場と同じ文言で記録されないことを伝える", async () => {
    mockUseAuth.mockReturnValue({ user: undefined, isLoading: false });

    render(<ExamRecordNotice />);

    expect(await screen.findByText(/signInNote/)).toBeTruthy();
    const link = document.querySelector('a[href="/sign-in"]');
    expect(link).not.toBeNull();
    expect(link?.textContent).toBe("signInLink");
  });

  it("認証状態の解決中は何も出さない", () => {
    mockUseAuth.mockReturnValue({ user: undefined, isLoading: true });

    const { container } = render(<ExamRecordNotice />);

    expect(container.innerHTML).toBe("");
  });

  it("ログイン済みなら何も出さない", () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-1" }, isLoading: false });

    const { container } = render(<ExamRecordNotice />);

    expect(container.innerHTML).toBe("");
  });
});
