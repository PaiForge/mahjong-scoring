import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MaskedEmail } from "../masked-email";

afterEach(cleanup);

const labels = {
  revealEmail: "メールアドレスを表示",
  hideEmail: "メールアドレスを隠す",
};

describe("MaskedEmail", () => {
  it("切り替えるまではアドレスを伏せて表示する", () => {
    render(<MaskedEmail email="k_okishima@fuji.enterprises" labels={labels} />);

    expect(screen.getByText("k***@fuji.enterprises")).toBeTruthy();
    expect(screen.queryByText("k_okishima@fuji.enterprises")).toBeNull();
  });

  it("押すたびに表示と非表示を切り替える", () => {
    render(<MaskedEmail email="k_okishima@fuji.enterprises" labels={labels} />);

    fireEvent.click(screen.getByRole("button", { name: labels.revealEmail }));
    expect(screen.getByText("k_okishima@fuji.enterprises")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: labels.hideEmail }));
    expect(screen.getByText("k***@fuji.enterprises")).toBeTruthy();
  });

  it("アドレスが無いときは切り替えボタンを出さない", () => {
    render(<MaskedEmail email={null} labels={labels} />);

    expect(screen.getByText("-")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
