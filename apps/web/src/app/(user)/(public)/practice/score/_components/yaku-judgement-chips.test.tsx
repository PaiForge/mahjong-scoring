import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { YakuJudgementChips } from "./yaku-judgement-chips";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));

describe("YakuJudgementChips", () => {
  it("役ごとに正誤の記号を付ける（まとめて1つにしない）", () => {
    render(
      <YakuJudgementChips
        judgements={[
          { name: "混一色", state: "correct" },
          { name: "三暗刻", state: "correct" },
          { name: "門前清自摸和", state: "incorrect" },
        ]}
        emptyLabel="なし"
      />,
    );

    expect(screen.getByText("混一色").textContent).toContain("✓");
    expect(screen.getByText("三暗刻").textContent).toContain("✓");
    expect(screen.getByText("門前清自摸和").textContent).toContain("✗");
  });

  it("状態ごとに色を変える", () => {
    render(
      <YakuJudgementChips
        judgements={[
          { name: "混一色", state: "correct" },
          { name: "門前清自摸和", state: "incorrect" },
          { name: "三暗刻", state: "missed" },
        ]}
        emptyLabel="なし"
      />,
    );

    expect(screen.getByText("混一色").className).toContain("text-primary-700");
    expect(screen.getByText("門前清自摸和").className).toContain(
      "text-destructive-strong",
    );
    expect(screen.getByText("三暗刻").className).toContain(
      "text-warning-strong",
    );
  });

  it("選び忘れは記号ではなく語で示す（色だけに頼らない）", () => {
    render(
      <YakuJudgementChips
        judgements={[{ name: "三暗刻", state: "missed" }]}
        emptyLabel="なし"
      />,
    );

    // intl モックはキーをそのまま返す
    expect(screen.getByText("三暗刻").textContent).toContain(
      "yakuJudgement.missed",
    );
  });

  it("役が無いときは代替テキストを出す", () => {
    render(<YakuJudgementChips judgements={[]} emptyLabel="なし" />);

    expect(screen.getByText("なし")).toBeDefined();
  });

  it("onSelect があるとき、役をタップすると役名を通知する", () => {
    const onSelect = vi.fn();
    render(
      <YakuJudgementChips
        judgements={[{ name: "混一色", state: "correct" }]}
        emptyLabel="なし"
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByText("混一色"));
    expect(onSelect).toHaveBeenCalledWith("混一色");
  });

  it("牌まで含んだ役牌は「役牌」として通知する（早見表は1枚のカードにまとめている）", () => {
    const onSelect = vi.fn();
    render(
      <YakuJudgementChips
        judgements={[{ name: "役牌 白", state: "correct" }]}
        emptyLabel="なし"
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByText("役牌 白"));
    expect(onSelect).toHaveBeenCalledWith("役牌");
  });

  it("早見表に例示手牌が無い役（状況役）はタップ対象にしない", () => {
    render(
      <YakuJudgementChips
        judgements={[{ name: "門前清自摸和", state: "incorrect" }]}
        emptyLabel="なし"
        onSelect={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("onSelect が無いときはタップ対象にしない", () => {
    render(
      <YakuJudgementChips
        judgements={[{ name: "混一色", state: "correct" }]}
        emptyLabel="なし"
      />,
    );

    expect(screen.queryByRole("button")).toBeNull();
  });
});
