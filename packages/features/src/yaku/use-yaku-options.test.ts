// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { messages } from "@mahjong-scoring/messages/ja";

import { IntlWrapper } from "../test/intl-wrapper";
import { useYakuLabel, useYakuOptions } from "./use-yaku-options";

describe("useYakuLabel", () => {
  it("役名を辞書の表示名に変換する", () => {
    const { result } = renderHook(() => useYakuLabel(), {
      wrapper: IntlWrapper,
    });
    expect(result.current("断么九")).toBe(messages.agariScore.yaku.tanyao);
  });

  it("辞書に無い役名はそのまま返す", () => {
    const { result } = renderHook(() => useYakuLabel(), {
      wrapper: IntlWrapper,
    });
    expect(result.current("未知の役")).toBe("未知の役");
  });
});

describe("useYakuOptions", () => {
  it("与えた並び順のまま表示名を付けた選択肢を返す", () => {
    const order = ["平和", "立直"];
    const { result } = renderHook(() => useYakuOptions(order), {
      wrapper: IntlWrapper,
    });
    expect(result.current).toEqual([
      { value: "平和", label: messages.agariScore.yaku.pinfu },
      { value: "立直", label: messages.agariScore.yaku.riichi },
    ]);
  });
});
