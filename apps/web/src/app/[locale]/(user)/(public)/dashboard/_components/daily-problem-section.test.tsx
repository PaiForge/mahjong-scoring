import { describe, expect, it, vi } from "vitest";
// 手牌のプレビュー（牌）を描くので TileImageProvider で包む render を使う
import { render } from "@/test/tile-image-render";

import { eligibleAgariPayload } from "@/lib/daily-problem/test-payloads";

vi.mock("next-intl/server", async () => await import("@/test/intl-mock"));
// 主ボタン（LinkButton）が遷移待ちの表示でクライアント側の辞書を引く
vi.mock("next-intl", async () => await import("@/test/intl-mock"));

const { DailyProblemSection } = await import("./daily-problem-section");

async function show(answer?: { readonly isCorrect: boolean }) {
  return render(
    await DailyProblemSection({
      payload: eligibleAgariPayload(),
      answer,
      locale: "ja",
    }),
  );
}

describe("DailyProblemSection", () => {
  it("未解答なら手牌と、本日の問題へ送る「解く」ボタンを出す", async () => {
    const { container, getByText, getByRole, queryByText } = await show();

    expect(getByText("title")).toBeTruthy();
    expect(container.querySelector("img")).toBeTruthy();
    expect(getByRole("link", { name: "card.start" }).getAttribute("href")).toBe(
      "/daily-problem",
    );
    expect(queryByText("card.review")).toBeNull();
    expect(
      container.querySelector("section")?.getAttribute("data-daily-problem"),
    ).toBe("open");
  });

  it("正解で解答済みなら手牌と「解答済み · 正解」・「もう一度見る」の文字リンクを出し、ボタンは出さない", async () => {
    const { container, getByText, getByRole, queryByRole } = await show({
      isCorrect: true,
    });

    expect(container.querySelector("img")).toBeTruthy();
    expect(getByText("card.answeredCorrect")).toBeTruthy();
    expect(
      getByRole("link", { name: "card.review" }).getAttribute("href"),
    ).toBe("/daily-problem");
    expect(queryByRole("link", { name: "card.start" })).toBeNull();
    expect(
      container.querySelector("section")?.getAttribute("data-daily-problem"),
    ).toBe("answered");
  });

  it("不正解で解答済みなら「解答済み · 不正解」を出す", async () => {
    const { getByText, queryByText } = await show({ isCorrect: false });

    expect(getByText("card.answeredIncorrect")).toBeTruthy();
    expect(queryByText("card.answeredCorrect")).toBeNull();
  });

  it("英語のページでは英語の本日の問題へ送る", async () => {
    const { getByRole } = render(
      await DailyProblemSection({
        payload: eligibleAgariPayload(),
        answer: undefined,
        locale: "en",
      }),
    );

    expect(getByRole("link", { name: "card.start" }).getAttribute("href")).toBe(
      "/en/daily-problem",
    );
  });
});
