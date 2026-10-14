import { cleanup, fireEvent, screen } from "@testing-library/react";
// 牌を描くので TileImageProvider で包む render を使う
import { render } from "@/test/tile-image-render";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));
// 面子分解（features の共有フック）は use-intl から辞書を読む
vi.mock("use-intl", async () => await import("@/test/intl-mock"));
vi.mock("next/navigation", async () => await import("@/test/navigation-mock"));

const { TryBoard } = await import("./try-board");

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

describe("TryBoard", () => {
  beforeEach(() => {
    cleanup();
  });

  it("最初は出題文と回答フォームを出し、登録への誘導はまだ出さない", () => {
    render(<TryBoard />);

    expect(screen.getByText("board.questionPrompt")).toBeTruthy();
    expect(select("form.labels.han")).toBeTruthy();
    expect(signUpLink()).toBeNull();
  });

  it("回答すると答え合わせと登録への誘導を出し、フッターの「わからない」を消す", () => {
    render(<TryBoard />);

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
    render(<TryBoard />);

    fireEvent.click(screen.getByRole("button", { name: "revealButton" }));

    expect(screen.getByText("result.headers.correct")).toBeTruthy();
    expect(signUpLink()).toBeTruthy();
  });

  it("答え合わせのあとの導線は、答え合わせが出てから出す", () => {
    render(<TryBoard afterAnswer={<p>after-answer</p>} />);

    expect(screen.queryByText("after-answer")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "revealButton" }));

    expect(screen.getByText("after-answer")).toBeTruthy();
  });
});
