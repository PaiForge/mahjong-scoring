import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import type { CurriculumChapter } from "@mahjong-scoring/features/curriculum/registry";

import { SectionTitle } from "../components/section-title";
import { CurriculumTocLink } from "../dojo/chapter-toc-list";
import {
  CurriculumProgressBar,
  CurriculumToc,
} from "../lessons/components/curriculum-toc";
import {
  countPortedCompleted,
  PORTED_LESSONS,
} from "../lessons/ported-lessons";

/**
 * ホームの「レッスンの続き」（web の `ContinueLearningSection`）
 * レッスンの続き
 *
 * 進捗バーと「次はここから」のレッスン 1 件をレッスンの目次と同じ見た目で出し、
 * 末尾に目次への導線を置く。目次全体はレッスンのタブの役目なので、ここでは
 * 次の 1 件だけに絞る（web と同じ）。
 *
 * 出すのは黒帯への道を終えた（全級取得済みの）ユーザーだけで、出す / 出さないと
 * 次のレッスンは features の `selectDashboardGuidance` が決める。進捗の数え方は
 * レッスンの目次と同じ（モバイルで開けるレッスンだけを数える）。
 */
export function ContinueLearningSection({
  completedSlugs,
  nextChapter,
}: {
  /** 完了したレッスン（章） */
  readonly completedSlugs: ReadonlySet<string>;
  /** 次に取り組むレッスン */
  readonly nextChapter: CurriculumChapter;
}) {
  const t = useTranslations("dashboard");

  return (
    <View style={styles.section}>
      <SectionTitle>{t("continueLearningTitle")}</SectionTitle>
      <CurriculumProgressBar
        completedCount={countPortedCompleted(completedSlugs)}
        totalCount={PORTED_LESSONS.length}
        allCompleted={false}
      />
      <CurriculumToc
        section={nextChapter.section}
        chapters={[nextChapter]}
        completedSlugs={completedSlugs}
        nextSlug={nextChapter.slug}
      />
      <CurriculumTocLink />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 16,
  },
});
