import { render, screen, cleanup } from "@testing-library/react";
import { createTranslator } from "next-intl";
import { messages } from "@mahjong-scoring/messages/ja";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: async () =>
    createTranslator({
      locale: "ja",
      messages,
      namespace: "admin.problemCategories",
    }),
}));

import { parseProblemSearch } from "../_lib/search";
import { ProblemSearchForm, ProblemSearchSummary } from "./problem-search-form";

afterEach(cleanup);

describe("保存問題の検索フォーム", () => {
  it("URL で選択した値を表示し、GET 送信で条件を保持してページを先頭に戻す", async () => {
    const state = parseProblemSearch({
      search: "1",
      fu: ["30", "50"],
      hanMin: "2",
      yaku: ["yaku-riichi", "yaku-yakuhai"],
      yakuMode: "all",
      machi: "machi-tanki",
      level: "level-normal",
      kind: "tenpai-score",
      agari: "ron",
      menzen: "true",
      page: "3",
    });
    const { container } = render(await ProblemSearchForm({ state }));
    expect(screen.getByLabelText("30 符")).toHaveProperty("checked", true);
    expect(screen.getByLabelText("50 符")).toHaveProperty("checked", true);
    expect(screen.getByLabelText("40 符")).toHaveProperty("checked", false);
    expect(screen.getByLabelText("役牌")).toHaveProperty("checked", true);
    expect(screen.getByLabelText("役の組み合わせ")).toHaveProperty(
      "value",
      "all",
    );
    expect(screen.getByLabelText("問題の種別")).toHaveProperty(
      "value",
      "tenpai-score",
    );
    const form = container.querySelector("form")!;
    expect(form.method).toBe("get");
    const data = new FormData(form);
    expect(data.getAll("fu")).toEqual(["30", "50"]);
    expect(data.getAll("yaku")).toEqual(["yaku-riichi", "yaku-yakuhai"]);
    expect(data.get("hanMin")).toBe("2");
    expect(data.get("search")).toBe("1");
    expect(data.has("page")).toBe(false);
    expect(data.has("category")).toBe(false);
  });

  it("逆転した範囲を残し、検索未実行と修正方法を表示する", async () => {
    render(
      await ProblemSearchForm({
        state: parseProblemSearch({ fuMin: "60", fuMax: "40" }),
      }),
    );
    expect(screen.getByRole("alert").textContent).toContain(
      "検索は実行していません",
    );
    expect(screen.getByRole("alert").textContent).toContain("下限は上限以下");
    expect(screen.getByLabelText("符の下限")).toHaveProperty("value", "60");
    expect(screen.getByLabelText("符の上限")).toHaveProperty("value", "40");
  });

  it("検索結果の条件には、URL で省略した役の OR も明示する", async () => {
    const { fields } = parseProblemSearch({
      yaku: ["yaku-honitsu", "yaku-chinitsu"],
    });
    render(await ProblemSearchSummary({ fields }));
    expect(screen.getByText("いずれかを含む")).toBeTruthy();
    expect(screen.getByText("混一色 / 清一色")).toBeTruthy();
  });
});
