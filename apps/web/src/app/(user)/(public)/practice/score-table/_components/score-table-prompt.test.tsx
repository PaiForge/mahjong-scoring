import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { useDisplaySettingsStore } from "@/app/_hooks/use-display-settings-store";
import { DEFAULT_FU_HAN_ORDER } from "@/app/_lib/fu-han-order";
import { ScoreTablePrompt } from "./score-table-prompt";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));

afterEach(() => {
  useDisplaySettingsStore.setState({ fuHanOrder: DEFAULT_FU_HAN_ORDER });
});

/** 出題条件の行に出た文言を、画面上の順で返す */
function promptLabels(): readonly string[] {
  return screen.getAllByText(/^(fu|han)$/).map((el) => el.textContent ?? "");
}

describe("ScoreTablePrompt", () => {
  it("既定では符→翻の順に出す（点数表を引く目線と同じ）", () => {
    render(<ScoreTablePrompt isOya={false} isTsumo={false} han={4} fu={30} />);

    expect(promptLabels()).toEqual(["fu", "han"]);
  });

  it("表示設定を翻→符にすると出題文も入れ替わる", () => {
    useDisplaySettingsStore.setState({ fuHanOrder: "han-first" });

    render(<ScoreTablePrompt isOya={false} isTsumo={false} han={4} fu={30} />);

    expect(promptLabels()).toEqual(["han", "fu"]);
  });

  it("満貫以上（符なし）は翻だけを出す", () => {
    render(<ScoreTablePrompt isOya isTsumo han={5} />);

    expect(promptLabels()).toEqual(["han"]);
  });
});
