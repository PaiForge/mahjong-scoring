import { cleanup, fireEvent, screen } from "@testing-library/react";
// 牌を描くので TileImageProvider で包む render を使う
import { render } from "@/test/tile-image-render";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDisplaySettingsStore } from "@/app/_hooks/use-display-settings-store";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));
// 面子分解（features の共有フック）は use-intl から辞書を読む
vi.mock("use-intl", async () => await import("@/test/intl-mock"));
vi.mock("next/navigation", async () => await import("@/test/navigation-mock"));

const { TryBoard } = await import("./try-board");

/** 日本語のページの張る先（`resolveNavTargetFor` は日本語では入力をそのまま返す） */
const JA_TARGETS = {
  signUpTarget: { href: "/sign-up", crossLocale: false },
  browseTarget: { href: "/practice", crossLocale: false },
} as const;

/** 英語のページの張る先（登録は英語で未公開、練習一覧は公開） */
const EN_TARGETS = {
  signUpTarget: { href: "/sign-up", crossLocale: true },
  browseTarget: { href: "/en/practice", crossLocale: false },
} as const;

/** ラベルから select を引く（紐付いていなければ取得に失敗する） */
function select(label: string) {
  return screen.getByLabelText(label) as HTMLSelectElement;
}

function choose(label: string, value: string | number) {
  fireEvent.change(select(label), { target: { value: String(value) } });
}

function signUpLink() {
  return screen.queryByRole("link", { name: "signUp.cta" });
}

// このファイルは select の入力方式を検査する（タイルは score-tile-picker.test.tsx）
beforeEach(() => {
  useDisplaySettingsStore.setState({ scoreInput: "select" });
});

describe("TryBoard", () => {
  beforeEach(() => {
    cleanup();
  });

  it("最初は出題文と回答フォームを出し、登録への誘導はまだ出さない", () => {
    render(<TryBoard {...JA_TARGETS} />);

    expect(screen.getByText("board.questionPrompt")).toBeTruthy();
    expect(select("form.labels.han")).toBeTruthy();
    expect(signUpLink()).toBeNull();
  });

  it("回答すると答え合わせと登録への誘導を出し、フッターの「わからない」を消す", () => {
    render(<TryBoard {...JA_TARGETS} />);

    choose("form.labels.han", 1);
    choose("form.labels.fu", 40);
    choose("form.labels.score", 1300);
    fireEvent.click(
      screen.getByRole("button", { name: "form.buttons.answer" }),
    );

    expect(screen.getByText("result.headers.correct")).toBeTruthy();
    expect(signUpLink()?.getAttribute("href")).toBe("/sign-up");
    expect(
      screen.getByRole("link", { name: "signUp.browse" }).getAttribute("href"),
    ).toBe("/practice");
    expect(screen.queryByRole("button", { name: "revealButton" })).toBeNull();
  });

  it("「わからない」で回答せずに正解を開示しても登録への誘導を出す", () => {
    render(<TryBoard {...JA_TARGETS} />);

    fireEvent.click(screen.getByRole("button", { name: "revealButton" }));

    expect(screen.getByText("result.headers.correct")).toBeTruthy();
    expect(signUpLink()).toBeTruthy();
  });

  it("答え合わせのあとの導線は、答え合わせが出てから出す", () => {
    render(<TryBoard {...JA_TARGETS} afterAnswer={<p>after-answer</p>} />);

    expect(screen.queryByText("after-answer")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "revealButton" }));

    expect(screen.getByText("after-answer")).toBeTruthy();
  });

  it("英語のページでは、登録を印付きの日本語の登録へ、練習一覧を英語の練習一覧へ張る", () => {
    render(<TryBoard {...EN_TARGETS} />);

    fireEvent.click(screen.getByRole("button", { name: "revealButton" }));

    const signUp = screen.getByRole("link", { name: /signUp\.cta/ });
    expect(signUp.getAttribute("href")).toBe("/sign-up");
    expect(signUp.getAttribute("hrefLang")).toBe("ja");
    expect(signUp.textContent).toContain("language.japaneseOnly");
    const browse = screen.getByRole("link", { name: "signUp.browse" });
    expect(browse.getAttribute("href")).toBe("/en/practice");
    expect(browse.getAttribute("hrefLang")).toBeNull();
  });
});
