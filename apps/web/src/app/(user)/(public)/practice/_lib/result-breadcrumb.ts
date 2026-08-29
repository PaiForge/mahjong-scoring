import type { BreadcrumbItem } from "@/app/(user)/_components/breadcrumb";

/** 結果ページのパンくず・戻り導線の親一覧（練習一覧または道場） */
export interface ResultBreadcrumbParent {
  readonly href: "/practice" | "/dojo";
  /** ラベル（`<namespace>.title`）を引く翻訳 namespace */
  readonly namespace: "practice" | "dojo";
}

/**
 * 結果ページの親一覧を説明ページ URL から決める
 * 結果親一覧決定
 *
 * 昇級試験は `/exam` 配下に住み練習一覧のカードにならないため、親を
 * 道場にする。ラベルは server / client で翻訳 API が異なるため、
 * 呼び出し側が `namespace` の `title` を引いて渡す。
 *
 * @param introHref 説明ページの URL。持たない練習は undefined
 *   （説明ページを持たない練習は必ず `/practice` 配下なので練習一覧になる）
 */
export function resultBreadcrumbParent(
  introHref: string | undefined,
): ResultBreadcrumbParent {
  return introHref?.startsWith("/exam") === true
    ? { href: "/dojo", namespace: "dojo" }
    : { href: "/practice", namespace: "practice" };
}

interface ResultBreadcrumbArgs {
  /** 親一覧のラベル（`resultBreadcrumbParent` の namespace の `title`） */
  readonly parentLabel: string;
  /** 親一覧の URL（`resultBreadcrumbParent` の href） */
  readonly parentHref: string;
  /** 練習名（各練習の `title`） */
  readonly practiceTitle: string;
  /** 結果ページを表すラベル（`challenge.resultSuffix`） */
  readonly resultLabel: string;
  /**
   * 練習説明ページの URL。説明ページを持たない練習では省略し、
   * その場合は中間項目をリンクなしのテキストとして表示する。
   */
  readonly introHref?: string;
}

/**
 * 結果ページのパンくず項目を組み立てる
 * 結果パンくず生成
 *
 * 結果ページ本体（`ResultView`: Server Component / `getTranslations`）と
 * 遷移中スケルトン（`ResultPageSkeleton`: Client Component / `useTranslations`）は
 * 翻訳の取得 API が異なるため、ラベルだけを引数で受け取り、項目の構造をここに
 * 集約する。両者のパンくずが食い違ってレイアウトがずれるのを防ぐ。
 */
export function buildResultBreadcrumb({
  parentLabel,
  parentHref,
  practiceTitle,
  resultLabel,
  introHref,
}: ResultBreadcrumbArgs): readonly BreadcrumbItem[] {
  return [
    { label: parentLabel, href: parentHref },
    introHref
      ? { label: practiceTitle, href: introHref }
      : { label: practiceTitle },
    { label: resultLabel },
  ];
}
