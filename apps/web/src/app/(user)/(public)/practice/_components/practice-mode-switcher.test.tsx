import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, expect, it, vi } from "vitest";
import { messages } from "@mahjong-scoring/messages/ja";
import { PracticeModeSwitcher } from "./practice-mode-switcher";
let query = "";
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(query),
}));
beforeEach(() => {
  query = "";
  localStorage.clear();
});
function show() {
  return render(
    <NextIntlClientProvider locale="ja" messages={messages}>
      <PracticeModeSwitcher
        basic={<p>基礎一覧</p>}
        practical={<p>実戦一覧</p>}
      />
    </NextIntlClientProvider>,
  );
}
it("初回は基礎練習を表示する", () => {
  show();
  expect(screen.getByText("基礎一覧")).toBeTruthy();
  expect(screen.queryByText("実戦一覧")).toBeNull();
});
it("再訪では保存された実戦練習を表示する", () => {
  localStorage.setItem("practice-mode", "practical");
  show();
  expect(screen.getByText("実戦一覧")).toBeTruthy();
});
it.each(["rank=kyu-4", "category=han", "mode=basic"])(
  "直接指定を保存済みモードより優先する: %s",
  (value) => {
    localStorage.setItem("practice-mode", "practical");
    query = value;
    show();
    expect(screen.getByText("基礎一覧")).toBeTruthy();
    expect(localStorage.getItem("practice-mode")).toBe("basic");
  },
);
it("実戦への直接リンクで選択を保存する", () => {
  query = "mode=practical";
  show();
  expect(
    screen.getByRole("link", { name: "実戦練習" }).getAttribute("aria-current"),
  ).toBe("page");
  expect(localStorage.getItem("practice-mode")).toBe("practical");
});
