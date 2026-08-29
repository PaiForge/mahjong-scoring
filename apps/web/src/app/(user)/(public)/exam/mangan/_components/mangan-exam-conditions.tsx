import { getTranslations } from "next-intl/server";

import { HighlightPanel } from "@/app/(user)/_components/highlight-panel";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { practiceMenuBySlug } from "@/lib/db/practice-menu-types";
import { beltClass, beltForegroundClass } from "@/lib/ranks/belt-colors";
import { rankRequiringMenu } from "@/lib/ranks/registry";

/**
 * 昇級試験の合格条件セクション
 * 合格条件表示
 *
 * Server Component。説明ページの開始ボタン直前に置き、通常チャレンジとの
 * ルール差（ミス1回で終了・合格ライン）を開始前に必ず伝える。数値は
 * レジストリ（練習: 制限時間・ミス上限 / ランク: 合格点）が正典。
 *
 * @remarks
 * このページは段級位の入口（道場・教本章末の試験カード）から来る。カード側は
 * 「何ができれば受かるか」（合格基準）だけを出し、制限時間・問題数・ミス上限は
 * ここにしか無い — 開始直前に必ず目に入る場所に 1 箇所だけ置く。
 *
 * 見出しに級名を入れ、帯色を着せる。この画面の h1 は練習名
 * （「昇級試験：満貫以上の点数計算」）で級を名乗らないため、どの級の試験に
 * 来たのかがここで確定する。色も入口のカードと同じ帯色にして、
 * オレンジの「5級 昇級試験」を押した先がオレンジの「5級 合格条件」で
 * 受かるようにする。
 */
export async function ManganExamConditions() {
  const menu = practiceMenuBySlug("mangan-exam");
  const exam = rankRequiringMenu(menu.menuType);
  if (!exam) return undefined;

  const t = await getTranslations("ranks");

  return (
    <section className="space-y-3">
      <SectionTitle
        toneClass={`${beltClass(exam.rank.slug)} ${beltForegroundClass(exam.rank.slug)}`}
      >
        {t("rankPassConditionsTitle", {
          rank: t(`names.${exam.rank.slug}`),
        })}
      </SectionTitle>
      <HighlightPanel>
        <p className="text-sm leading-relaxed text-surface-700">
          {t("passConditions", {
            timeLimit: menu.timeLimit,
            minScore: exam.requirement.minScore,
            mistakeLimit: menu.mistakeLimit,
          })}
        </p>
      </HighlightPanel>
    </section>
  );
}
