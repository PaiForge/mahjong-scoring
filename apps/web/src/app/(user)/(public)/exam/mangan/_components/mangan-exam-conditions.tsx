import { getTranslations } from "next-intl/server";

import { HighlightPanel } from "@/app/(user)/_components/highlight-panel";
import { practiceMenuBySlug } from "@/lib/db/practice-menu-types";
import { rankRequiringMenu } from "@/lib/ranks/registry";

/**
 * 昇級試験の合格条件パネル
 * 合格条件表示
 *
 * Server Component。説明ページの開始ボタン直前に置き、通常チャレンジとの
 * ルール差（ミス1回で終了・合格ライン）を開始前に必ず伝える。数値は
 * レジストリ（練習: 制限時間・ミス上限 / ランク: 合格点）が正典。
 */
export async function ManganExamConditions() {
  const menu = practiceMenuBySlug("mangan-exam");
  const exam = rankRequiringMenu(menu.menuType);
  if (!exam) return undefined;

  const t = await getTranslations("ranks");

  return (
    <HighlightPanel>
      <p className="text-sm font-bold text-surface-900">
        {t("passConditionsTitle")}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-surface-700">
        {t("passConditions", {
          timeLimit: menu.timeLimit,
          minScore: exam.requirement.minScore,
          mistakeLimit: menu.mistakeLimit,
        })}
      </p>
    </HighlightPanel>
  );
}
