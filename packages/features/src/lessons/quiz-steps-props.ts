/**
 * レッスンの確認問題の進み具合（`LessonQuizSteps`）の props（web とアプリで共有）
 * 確認問題進捗props
 */
export interface LessonQuizStepsProps {
  /** 今解いている問題（0 始まり） */
  readonly current: number;
  readonly total: number;
  /** 並び全体の名前（「2 / 5 問目」）。読み上げで今どこかを先に伝える */
  readonly label: string;
}
