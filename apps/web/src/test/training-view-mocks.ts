import { vi } from "vitest";

/**
 * `createTrainingView` で組んだ画面を描くテストの共通スタブ
 * トレーニング画面モック
 *
 * シェルは辞書・ルーター・結果の保存・試験の提出・認証コンテキスト（末尾の
 * 受験ゲート。模試のみ描く）を静的に引くので、どのテストも同じ 5 つを
 * 差し替える。テストの先頭で、検証対象より前に副作用として import する:
 *
 * ```ts
 * import "@/test/training-view-mocks";
 * import { createTrainingView } from "./create-challenge-views";
 * ```
 *
 * このモジュールはテスト専用。
 */
vi.mock("next-intl", async () => await import("@/test/intl-mock"));
vi.mock("next/navigation", async () => await import("@/test/navigation-mock"));
vi.mock(
  "@/app/(user)/(public)/practice/_actions/save-practice-result",
  async () => await import("@/test/save-practice-result-mock"),
);
vi.mock(
  "@/app/(user)/(public)/exam/_actions/submit-exam-result",
  async () => await import("@/test/submit-exam-result-mock"),
);
vi.mock(
  "@/app/_contexts/auth-context",
  async () => await import("@/test/auth-context-mock"),
);
