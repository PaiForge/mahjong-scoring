import { getTranslations } from "next-intl/server";
import { LinkButton } from "@/app/(user)/_components/link-button";
import { ArrowUturnLeftIcon } from "@/app/(user)/_components/icons/arrow-uturn-left-icon";
import { RotateCcwIcon } from "@/app/(user)/_components/icons/rotate-ccw-icon";
import type { PracticeResultViewProps } from "../_lib/create-practice-result-page";
import { resultBreadcrumbParent } from "../_lib/result-breadcrumb";
import { PRACTICE_SCROLL_HASH } from "../_lib/scroll-anchor";

type ResultPrimaryActionProps = Pick<
  PracticeResultViewProps,
  "playHref" | "introHref" | "primaryAction"
>;

/**
 * 結果画面の主ボタン（「もう一度」または親一覧へ戻る）
 * 結果主ボタン
 *
 * ボタン群の先頭と、問題別一覧の末尾の 2 か所に置く。一覧で間違えた問題を
 * 読み終えた位置から、広告とボタン群まで戻らずに再挑戦できるようにするため。
 * 2 か所で行き先が食い違わないよう、ここで 1 つに決める。
 *
 * `primaryAction` が "parent"（昇級試験の合格）のときは親一覧（道場）へ戻る
 * ボタンになる。合格した試験の再受験を勧める理由は無いため、一覧の末尾も同じ。
 */
export async function ResultPrimaryAction({
  playHref,
  introHref,
  primaryAction = "retry",
}: ResultPrimaryActionProps) {
  const tc = await getTranslations("challenge");

  if (primaryAction === "parent") {
    const parent = resultBreadcrumbParent(introHref);
    return (
      <LinkButton href={parent.href} size="lg" fullWidth>
        <ArrowUturnLeftIcon className="size-4" />
        {tc(parent.namespace === "dojo" ? "backToDojo" : "backToList")}
      </LinkButton>
    );
  }

  return (
    <LinkButton href={`${playHref}${PRACTICE_SCROLL_HASH}`} size="lg" fullWidth>
      <RotateCcwIcon className="size-4" />
      {tc("retryButton")}
    </LinkButton>
  );
}
