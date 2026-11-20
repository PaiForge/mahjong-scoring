/**
 * 出題した問題の誤りの報告の定義（理由・段階・詳細の検証・送る本文）
 * 問題報告定義
 *
 * 利用者が、出題された問題の正解（点数・役・符・待ち牌）や盤面の誤りを運営へ
 * 知らせるための契約。web の報告フォームが選択肢を出し、Server Action が同じ
 * 規則で検証する。理由のキーは DB・辞書（`problemReport.reasons.<key>`）で同じ
 * 文字列を使う。利用者の通報（`reports/report.ts`）とは別物で、他の利用者ではなく
 * 問題（`practice_problems` の行）に結び付く。
 *
 * 対象の画面は web の 3 つ — 和了形の点数計算の play（`agari-score`）・
 * 聴牌形の点数計算の play（`tenpai-score`）・本日の問題（`daily-problem`）。
 * 盤面を保存できる種別（core の `ARCHIVE_KINDS`）の問題を出す画面がこの 3 つで、
 * 報告は保存した盤面の行に結び付けるため、盤面を保存できる画面に限る。
 *
 * @design
 * - アプリ（apps/mobile）は入口と画面を持たない。契約（このファイル）とサーバーの
 *   本体は共有できる形にしておき、アプリの入口は別の作業にする（ストアの審査を挟むため）
 * - 盤面の保存形式を持たない練習（チャレンジ型・模試・レッスン・お試し）は対象外。
 *   報告を結び付ける盤面の行を作れない
 */
import type {
  ArchiveKind,
  PracticeProblemArchiveRequest,
  RuleSettings,
} from "@mahjong-scoring/core";

/**
 * 問題の誤りの報告の理由（並びは選択肢の並び）
 *
 * 利用者は 1 つだけ選び、補足は詳細に書く。「その他」だけは詳細の記入が必須
 * （何が誤っているかが理由から読めないため）。選べる理由は問題の種別と、正解を
 * どこまで見せたかで絞る（{@link problemReportReasonsFor}）。
 *
 * @design
 * - 点数・役（翻）・符を分けて持つ。誤りは「役の複合漏れ → 翻 → 点数」のように
 *   連鎖して見え、気付く所が人によって違う。分けておくと調べる入口が絞れる
 * - 複数選択は採らない。既存の通報フォームと同じ操作にし、補足は詳細に書ける
 */
export const PROBLEM_REPORT_REASONS = [
  "wrong_score",
  "wrong_yaku",
  "wrong_fu",
  "wrong_machi",
  "invalid_board",
  "other",
] as const;

/** 問題の誤りの報告の理由（{@link PROBLEM_REPORT_REASONS}） */
export type ProblemReportReason = (typeof PROBLEM_REPORT_REASONS)[number];

/** 詳細の最大長（入力欄の `maxLength` もここから引く） */
export const PROBLEM_REPORT_DETAIL_MAX_LENGTH = 500;

/** 報告を出した画面。DB の CHECK・管理画面の表示と同じ文字列 */
export const PROBLEM_REPORT_CONTEXTS = [
  "agari-score",
  "tenpai-score",
  "daily-problem",
] as const;

/** 報告を出した画面（{@link PROBLEM_REPORT_CONTEXTS}） */
export type ProblemReportContext = (typeof PROBLEM_REPORT_CONTEXTS)[number];

/**
 * 正解をどこまで見せたか
 * 問題報告段階
 *
 * - `answering`: まだ見せていない
 * - `machiRevealed`: 聴牌形で待ちだけ見せた（点数はまだ）
 * - `revealed`: 全部見せた
 */
export type ProblemReportStage = "answering" | "machiRevealed" | "revealed";

const BEFORE_REVEAL_REASONS: readonly ProblemReportReason[] = [
  "invalid_board",
  "other",
];

const TENPAI_MACHI_REVEALED_REASONS: readonly ProblemReportReason[] = [
  "wrong_machi",
  "invalid_board",
  "other",
];

const AGARI_REVEALED_REASONS: readonly ProblemReportReason[] = [
  "wrong_score",
  "wrong_yaku",
  "wrong_fu",
  "invalid_board",
  "other",
];

/**
 * 問題の種別と段階で選べる理由を返す（並びは {@link PROBLEM_REPORT_REASONS} の順）
 * 問題報告理由絞り込み
 *
 * - 正解を見る前（`answering`）は `invalid_board` と `other` だけ。見ていない正解が
 *   「違う」とは言えないため
 * - 聴牌形で待ちだけ見せた後（`machiRevealed`）は `wrong_machi` が加わる
 * - 全部見せた後（`revealed`）は点数・役・符が加わる。`wrong_machi` は聴牌形だけ
 *   （和了形は待ちを答えさせない）
 * - 和了形に `machiRevealed` は起こらない。来たら `answering` と同じに扱う
 */
export function problemReportReasonsFor(
  kind: ArchiveKind,
  stage: ProblemReportStage,
): readonly ProblemReportReason[] {
  switch (stage) {
    case "answering":
      return BEFORE_REVEAL_REASONS;
    case "machiRevealed":
      return kind === "tenpai-score"
        ? TENPAI_MACHI_REVEALED_REASONS
        : BEFORE_REVEAL_REASONS;
    case "revealed":
      return kind === "tenpai-score"
        ? PROBLEM_REPORT_REASONS
        : AGARI_REVEALED_REASONS;
  }
}

/**
 * 理由がその種別・段階で選べるかを判定する
 * 問題報告理由許可判定
 *
 * サーバーが、画面に出ていないはずの理由（正解を見る前の「点数が違う」等）を弾くのに使う。
 */
export function isProblemReportReasonAllowed(
  kind: ArchiveKind,
  stage: ProblemReportStage,
  reason: ProblemReportReason,
): boolean {
  return problemReportReasonsFor(kind, stage).includes(reason);
}

const problemReportReasonSet: ReadonlySet<string> = new Set(
  PROBLEM_REPORT_REASONS,
);

function isProblemReportReason(value: unknown): value is ProblemReportReason {
  return typeof value === "string" && problemReportReasonSet.has(value);
}

/** 報告の入力の誤り（辞書の `problemReport.errors.<key>` と対応する） */
export const PROBLEM_REPORT_INPUT_ERRORS = [
  "invalidReason",
  "detailRequired",
  "detailTooLong",
] as const;

/** 報告の入力の誤り（{@link PROBLEM_REPORT_INPUT_ERRORS}） */
export type ProblemReportInputError =
  (typeof PROBLEM_REPORT_INPUT_ERRORS)[number];

/** 検証済みの報告の入力（詳細は前後の空白を除き、空なら null） */
export interface ProblemReportInput {
  readonly reason: ProblemReportReason;
  readonly detail: string | null;
}

/**
 * 報告の入力（理由・詳細）を検証する
 * 問題報告入力検証
 *
 * クライアント（送る前の案内）とサーバー（信頼境界）の両方で使う。詳細は前後の
 * 空白を除いて数え、空なら null にする。理由が段階に合うかは見ない
 * （{@link isProblemReportReasonAllowed} で別に確かめる）。
 */
export function validateProblemReportInput(
  reason: unknown,
  detail: unknown,
):
  | { readonly ok: true; readonly value: ProblemReportInput }
  | { readonly ok: false; readonly error: ProblemReportInputError } {
  if (!isProblemReportReason(reason)) {
    return { ok: false, error: "invalidReason" };
  }
  const trimmed = typeof detail === "string" ? detail.trim() : "";
  if (trimmed.length > PROBLEM_REPORT_DETAIL_MAX_LENGTH) {
    return { ok: false, error: "detailTooLong" };
  }
  if (reason === "other" && trimmed === "") {
    return { ok: false, error: "detailRequired" };
  }
  return { ok: true, value: { reason, detail: trimmed || null } };
}

/**
 * 報告を送る本文（Server Action とアプリ向け API が受け取る）
 * 問題報告要求
 *
 * 盤面は保存と同じ形（`problem`）で送り、サーバーが `practice_problems` の行に
 * 結び付ける。`ruleSettings` は利用者の端末のルール設定で、正解はこの設定で
 * 組み立てたもの（同じ盤面でも設定で正解が変わるので、調べるときに要る）。
 * `reason`・`detail` は信頼しない入力で、{@link validateProblemReportInput} で検証する。
 */
export interface ProblemReportRequest {
  readonly problem: PracticeProblemArchiveRequest;
  readonly context: ProblemReportContext;
  readonly stage: ProblemReportStage;
  readonly ruleSettings: RuleSettings;
  readonly reason: string;
  readonly detail: string;
}
