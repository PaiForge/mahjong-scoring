import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import type { CurriculumChapterSlug } from "@mahjong-scoring/features/curriculum/registry";

import { Button } from "../../components/button";
import {
  useLessonCompleted,
  useLessonCompletionStore,
} from "../../hooks/use-lesson-completion-store";
import { DoneMark } from "./done-mark";

/**
 * 確認問題を持たないレッスンの章末の完了ボタン（web の `ChapterCompleteButton`）
 * 章完了ボタン
 *
 * 確認問題を持たないレッスン（基礎・点数記憶術の章）には区切りが無いので、
 * 本人が押して完了にする。記録される印は確認問題と同じ（端末の完了の記録）。
 * 完了済みなら済みの印だけを出す（取り消しは無い）。
 *
 * web はログインしていないとログインへの導線を出すが、モバイルには
 * アカウントが無く、完了は端末に残すので常にボタンを出す。
 */
export function ChapterCompleteButton({
  slug,
}: {
  readonly slug: CurriculumChapterSlug;
}) {
  const t = useTranslations("learnCurriculum.chapter");
  const completed = useLessonCompleted(slug);
  const markCompleted = useLessonCompletionStore((s) => s.markCompleted);

  if (completed) {
    return (
      <View style={styles.done} testID="chapter-completed">
        <DoneMark label={t("completedMark")} />
      </View>
    );
  }

  return (
    <Button size="lg" fullWidth onPress={() => markCompleted(slug)}>
      {t("completeCta")}
    </Button>
  );
}

const styles = StyleSheet.create({
  done: {
    alignItems: "center",
  },
});
