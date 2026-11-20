import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { render } from "@/test/intl-render";
import { eligibleAgariPayload } from "@/lib/daily-problem/test-payloads";
import {
  ARCHIVE_SCHEMA_VERSION,
  DEFAULT_RULE_SETTINGS,
  type PracticeProblemArchiveRequest,
} from "@mahjong-scoring/core";
import type { ProblemReportStage } from "@mahjong-scoring/features/problem-reports/problem-report";

const { mockReport, mockToastSuccess } = vi.hoisted(() => ({
  mockReport: vi.fn(),
  mockToastSuccess: vi.fn(),
}));

vi.mock("@/app/[locale]/(user)/_actions/problem-reports", () => ({
  reportProblemAction: mockReport,
}));
vi.mock("react-hot-toast", () => ({ toast: { success: mockToastSuccess } }));

const { ProblemReportDialog } = await import("./problem-report-dialog");

const REQUEST: PracticeProblemArchiveRequest = {
  kind: "agari-score",
  schemaVersion: ARCHIVE_SCHEMA_VERSION,
  payload: eligibleAgariPayload(),
};

const REASON_LABELS = {
  wrong_score: "点数が間違っている",
  wrong_yaku: "役・翻数が間違っている",
  wrong_fu: "符が間違っている",
  wrong_machi: "待ち牌が間違っている",
  invalid_board: "手牌・ドラなど盤面がおかしい",
  other: "その他",
} as const;

type Context = "agari-score" | "tenpai-score" | "daily-problem";

function dialog(
  context: Context,
  stage: ProblemReportStage,
  onClose = vi.fn(),
) {
  return (
    <ProblemReportDialog
      isOpen
      onClose={onClose}
      problem={() => REQUEST}
      context={context}
      stage={stage}
    />
  );
}

function shownReasons(): string[] {
  return screen
    .getAllByRole("radio")
    .map((radio) => radio.closest("label")?.textContent ?? "");
}

function submitButton(): HTMLButtonElement {
  return screen.getByRole<HTMLButtonElement>("button", { name: "報告する" });
}

describe("ProblemReportDialog", () => {
  beforeEach(() => {
    mockReport.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe("選べる理由は問題の種別と正解を見せた段階で決まる", () => {
    it("正解を見る前は盤面の誤りとその他だけ", () => {
      render(dialog("agari-score", "answering"));
      expect(shownReasons()).toEqual([
        REASON_LABELS.invalid_board,
        REASON_LABELS.other,
      ]);
    });

    it("和了形で正解を見たら点数・役・符も選べ、待ち牌は選べない", () => {
      render(dialog("agari-score", "revealed"));
      expect(shownReasons()).toEqual([
        REASON_LABELS.wrong_score,
        REASON_LABELS.wrong_yaku,
        REASON_LABELS.wrong_fu,
        REASON_LABELS.invalid_board,
        REASON_LABELS.other,
      ]);
    });

    it("本日の問題は和了形として絞る", () => {
      render(dialog("daily-problem", "revealed"));
      expect(shownReasons()).not.toContain(REASON_LABELS.wrong_machi);
      expect(shownReasons()).toContain(REASON_LABELS.wrong_score);
    });

    it("聴牌形で待ちだけ見せたら待ち牌の誤りが加わる", () => {
      render(dialog("tenpai-score", "machiRevealed"));
      expect(shownReasons()).toEqual([
        REASON_LABELS.wrong_machi,
        REASON_LABELS.invalid_board,
        REASON_LABELS.other,
      ]);
    });

    it("聴牌形で全部見せたらすべての理由を選べる", () => {
      render(dialog("tenpai-score", "revealed"));
      expect(shownReasons()).toEqual(Object.values(REASON_LABELS));
    });
  });

  it("理由を選ぶまで送れない", () => {
    render(dialog("agari-score", "revealed"));
    expect(submitButton().disabled).toBe(true);
    fireEvent.click(screen.getByLabelText(REASON_LABELS.wrong_fu));
    expect(submitButton().disabled).toBe(false);
  });

  it("開いている間に段階が変わって選んだ理由が一覧から消えたら選択を外す", () => {
    const view = render(dialog("tenpai-score", "revealed"));
    fireEvent.click(screen.getByLabelText(REASON_LABELS.wrong_score));
    expect(submitButton().disabled).toBe(false);

    view.rerender(dialog("tenpai-score", "machiRevealed"));

    expect(
      screen.getAllByRole("radio").some((r) => (r as HTMLInputElement).checked),
    ).toBe(false);
    expect(submitButton().disabled).toBe(true);
  });

  it("「その他」は詳細が無いと送らずに理由を出す", () => {
    render(dialog("agari-score", "answering"));
    fireEvent.click(screen.getByLabelText(REASON_LABELS.other));
    fireEvent.click(submitButton());

    expect(screen.getByRole("alert").textContent).toBe(
      "「その他」を選んだときは詳細を書いてください。",
    );
    expect(mockReport).not.toHaveBeenCalled();
  });

  it("送ると盤面・画面・段階・ルール設定の真偽値・理由・詳細を渡し、閉じて受付のトーストを出す", async () => {
    const onClose = vi.fn();
    render(dialog("agari-score", "revealed", onClose));
    fireEvent.click(screen.getByLabelText(REASON_LABELS.wrong_score));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "子の 3900 点だと思う" },
    });
    fireEvent.click(submitButton());

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockReport).toHaveBeenCalledWith({
      problem: REQUEST,
      context: "agari-score",
      stage: "revealed",
      ruleSettings: DEFAULT_RULE_SETTINGS,
      reason: "wrong_score",
      detail: "子の 3900 点だと思う",
    });
    expect(mockToastSuccess).toHaveBeenCalledWith(
      "報告を受け付けました。ご協力ありがとうございます。",
    );
  });

  it.each([
    ["dailyLimit", "1 日に報告できる件数の上限に達しました。"],
    [
      "rateLimited",
      "短い時間に続けて報告されています。しばらくしてからお試しください。",
    ],
    ["unauthorized", "報告するにはログインが必要です。"],
    [
      "banned",
      "報告できませんでした。しばらくしてからもう一度お試しください。",
    ],
    [
      "invalidRequest",
      "報告できませんでした。しばらくしてからもう一度お試しください。",
    ],
  ])("送信が %s で失敗したら閉じずに文言を出す", async (code, message) => {
    mockReport.mockResolvedValue({ error: code });
    const onClose = vi.fn();
    render(dialog("agari-score", "revealed", onClose));
    fireEvent.click(screen.getByLabelText(REASON_LABELS.wrong_yaku));
    fireEvent.click(submitButton());

    expect((await screen.findByRole("alert")).textContent).toBe(message);
    expect(onClose).not.toHaveBeenCalled();
    expect(mockToastSuccess).not.toHaveBeenCalled();
  });

  it("Action が例外で終わっても送り直しを促す文言を出す", async () => {
    mockReport.mockRejectedValue(new Error("network"));
    render(dialog("agari-score", "answering"));
    fireEvent.click(screen.getByLabelText(REASON_LABELS.invalid_board));
    fireEvent.click(submitButton());

    expect((await screen.findByRole("alert")).textContent).toBe(
      "報告できませんでした。しばらくしてからもう一度お試しください。",
    );
  });
});
