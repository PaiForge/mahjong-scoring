import type { BreadcrumbItem } from "@/app/(user)/_components/breadcrumb";

interface ResultBreadcrumbArgs {
  /** 練習一覧のラベル（`practice.title`） */
  readonly practiceListLabel: string;
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
  practiceListLabel,
  practiceTitle,
  resultLabel,
  introHref,
}: ResultBreadcrumbArgs): readonly BreadcrumbItem[] {
  return [
    { label: practiceListLabel, href: "/practice" },
    introHref
      ? { label: practiceTitle, href: introHref }
      : { label: practiceTitle },
    { label: resultLabel },
  ];
}
