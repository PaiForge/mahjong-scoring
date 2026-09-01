/**
 * 背面スクロールロックのテスト
 *
 * @description
 * - ロック中は body のスクロールを止め、解除で元に戻す
 * - 入れ子で開いたとき: 内側を閉じただけでは解除しない
 * - useIsOverlayOpen: 覆っている UI が 1 つでもあれば true
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";

import { useBodyScrollLock, useIsOverlayOpen } from "./use-body-scroll-lock";

function Overlay({ isOpen }: { readonly isOpen: boolean }) {
  useBodyScrollLock(isOpen);
  return null;
}

function OverlayFlag() {
  return <span data-testid="flag">{String(useIsOverlayOpen())}</span>;
}

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
});

describe("useBodyScrollLock", () => {
  it("ロック中は body のスクロールを止め、解除で戻す", () => {
    const { rerender } = render(<Overlay isOpen />);
    expect(document.body.style.overflow).toBe("hidden");

    rerender(<Overlay isOpen={false} />);
    expect(document.body.style.overflow).toBe("");
  });

  it("入れ子のとき、内側を閉じただけでは解除しない", () => {
    const { rerender } = render(
      <>
        <Overlay isOpen />
        <Overlay isOpen />
      </>,
    );
    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <>
        <Overlay isOpen />
        <Overlay isOpen={false} />
      </>,
    );
    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <>
        <Overlay isOpen={false} />
        <Overlay isOpen={false} />
      </>,
    );
    expect(document.body.style.overflow).toBe("");
  });
});

describe("useIsOverlayOpen", () => {
  it("覆っている UI の開閉に追従する", () => {
    const { getByTestId, rerender } = render(
      <>
        <OverlayFlag />
        <Overlay isOpen={false} />
      </>,
    );
    expect(getByTestId("flag").textContent).toBe("false");

    rerender(
      <>
        <OverlayFlag />
        <Overlay isOpen />
      </>,
    );
    expect(getByTestId("flag").textContent).toBe("true");

    rerender(
      <>
        <OverlayFlag />
        <Overlay isOpen={false} />
      </>,
    );
    expect(getByTestId("flag").textContent).toBe("false");
  });
});
