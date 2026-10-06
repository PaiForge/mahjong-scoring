import { render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, expect, it, vi } from "vitest";
import { messages } from "@mahjong-scoring/messages/ja";
import { PlanBenefit } from "@mahjong-scoring/features/billing/plans";
import { PracticeEntryQuota } from "./practice-entry-quota";
import { peekPracticeQuota } from "../_actions/begin-practice-question";

vi.mock("../_actions/begin-practice-question", () => ({
  peekPracticeQuota: vi.fn(),
}));
const result = {
  success: true as const,
  allowed: true,
  remaining: 3,
  limit: 5,
  signedIn: true,
  benefits: [],
};
beforeEach(() => {
  vi.mocked(peekPracticeQuota).mockReset();
});
function show() {
  return render(
    <NextIntlClientProvider locale="ja" messages={messages}>
      <PracticeEntryQuota menu="score" />
    </NextIntlClientProvider>,
  );
}
it("残量を消費せずに表示する", async () => {
  vi.mocked(peekPracticeQuota).mockResolvedValue(result);
  show();
  await screen.findByText("今日の無料分：残り 3 / 5 問");
  expect(peekPracticeQuota).toHaveBeenCalledWith("score");
});
it("未ログインで使い切った場合は回復とログインによる増枠を案内する", async () => {
  vi.mocked(peekPracticeQuota).mockResolvedValue({
    ...result,
    remaining: 0,
    limit: 1,
    allowed: false,
    signedIn: false,
  });
  show();
  await screen.findByText("本日の無料分は終了しました");
  expect(screen.getByText("毎日 0:00（日本時間）に回復します")).toBeTruthy();
  expect(
    screen
      .getByRole("link", { name: "ログインすると1日 5 問まで無料" })
      .getAttribute("href"),
  ).toBe("/sign-in");
});
it.each([true, false])(
  "無制限では販売案内を出さず、Proの有無を正しく表示する: %s",
  async (pro) => {
    vi.mocked(peekPracticeQuota).mockResolvedValue({
      ...result,
      remaining: "unlimited",
      limit: "unlimited",
      benefits: pro ? [PlanBenefit.UnlimitedPractice] : [],
    });
    show();
    await screen.findByText(
      pro ? "Pro · 回数無制限" : "回数制限なしで練習できます",
    );
    expect(screen.queryByRole("link")).toBeNull();
  },
);
it("取得失敗を残量ゼロとして扱わない", async () => {
  vi.mocked(peekPracticeQuota).mockRejectedValue(new Error("offline"));
  show();
  await waitFor(() =>
    expect(
      screen.getByText("利用枠を確認できませんでした。開始時に再確認します。"),
    ).toBeTruthy(),
  );
  expect(screen.queryByText("本日の無料分は終了しました")).toBeNull();
});
