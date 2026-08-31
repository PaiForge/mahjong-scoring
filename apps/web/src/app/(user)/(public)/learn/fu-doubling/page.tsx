/**
 * 符が倍になると1翻分
 *
 * @description
 * 点数の計算セクションの第5章。符を2倍にすることと翻を1つ増やすことが
 * 点数のうえで同じ意味を持つことを示し、点数表で覚える行を減らす。
 * @flow
 * 教本の目次または前章（鳴いた手の点数計算）から遷移し、読了マークを付けて
 * 点数表早引きの練習へ進む。
 */
import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { FuDoublingGuide } from "./_components/fu-doubling-guide";

export function generateMetadata() {
  return createLearnMetadata("fu-doubling");
}

export default function LearnFuDoublingPage() {
  return (
    <LearnPageLayout slug="fu-doubling">
      <FuDoublingGuide />
    </LearnPageLayout>
  );
}
