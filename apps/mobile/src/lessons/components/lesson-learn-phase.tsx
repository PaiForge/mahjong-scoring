import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import type { QuizLessonSlug } from "@mahjong-scoring/features/lessons/registry";

import { Button } from "../../components/button";
import { TextLink } from "../../components/text-link";
import { ChapterRelatedLinks } from "./chapter-related-links";
import { DoneMark } from "./done-mark";
import { NextLessonPreview, nextChapterSlug } from "./next-lesson-preview";

/**
 * レッスンの本文の段階（`learn`。web の `LessonLearnPhase`）
 * 本文の段階
 *
 * 本文の下のボタンは状態で替わる: 解いている途中なら「確認問題に戻る
 * （n / m 問目）」、完了済みなら控えめな解き直しのリンクと次のレッスン・
 * 練習への導線、それ以外は「確認問題へ」。
 */
export function LessonLearnPhase({
  slug,
  completed,
  inQuiz,
  index,
  total,
  explanation,
  footer,
  onStart,
}: {
  readonly slug: QuizLessonSlug;
  readonly completed: boolean;
  /** 確認問題を解いている途中か */
  readonly inQuiz: boolean;
  /** 解いている問題の番号（0 始まり） */
  readonly index: number;
  readonly total: number;
  readonly explanation: ReactNode;
  readonly footer: ReactNode;
  readonly onStart: () => void;
}) {
  const t = useTranslations("lessons");
  const nextSlug = nextChapterSlug(slug);
  return (
    <View style={styles.learn}>
      {/* 完了済みの印は本文の最初の見出しの行の右端 */}
      {completed && (
        <View style={styles.doneMark}>
          <DoneMark label={t("completedMark")} />
        </View>
      )}
      {explanation}
      {inQuiz ? (
        <Button
          size="lg"
          fullWidth
          onPress={onStart}
          testID="lesson-resume-quiz"
        >
          {t("resumeQuiz", { index: index + 1, total })}
        </Button>
      ) : completed ? (
        <>
          <TextLink onPress={onStart}>{t("retakeQuiz")}</TextLink>
          {/* 完了済みで開き直したときも、確認問題を解き直さずに次へ進める
              （確認問題を持たない章の完了後と同じ） */}
          {nextSlug !== undefined && <NextLessonPreview slug={nextSlug} />}
          <ChapterRelatedLinks slug={slug} />
        </>
      ) : (
        <Button
          size="lg"
          fullWidth
          onPress={onStart}
          testID="lesson-start-quiz"
        >
          {t("startQuiz", { count: total })}
        </Button>
      )}
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  learn: {
    gap: 32,
  },
  doneMark: {
    position: "absolute",
    top: 4,
    right: 0,
    zIndex: 1,
  },
});
