import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { MultiSelect } from "./multi-select";

const LABELS = { add: "追加", title: "役を選ぶ", done: "完了", close: "閉じる" };
const OPTIONS = [
  { value: "riichi", label: "立直" },
  { value: "tanyao", label: "断幺九" },
];

function open() {
  fireEvent.click(screen.getByRole("button", { name: /未選択/ }));
  return screen.getByRole("dialog");
}

describe("MultiSelect", () => {
  it.each([
    ["見出しの右の ×", "閉じる"],
    ["下端の完了ボタン", "完了"],
  ])("%sで選択を保ったまま閉じる", (_, name) => {
    const onChange = vi.fn();
    render(
      <MultiSelect
        options={OPTIONS}
        value={[]}
        onChange={onChange}
        placeholder="未選択"
        labels={LABELS}
      />,
    );

    open();
    fireEvent.click(screen.getByRole("option", { name: "立直" }));
    expect(onChange).toHaveBeenCalledWith(["riichi"]);

    fireEvent.click(screen.getByRole("button", { name }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
