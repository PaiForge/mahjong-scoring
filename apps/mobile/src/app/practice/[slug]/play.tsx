import { PracticePlayScreen } from "../../../practice/screens/practice-play-screen";
import { PracticeRoute } from "../../../practice/screens/practice-route";

/**
 * 練習のチャレンジ
 *
 * @description
 * 制限時間とミス上限のあるチャレンジ。記録は残らず、終わると結果画面へ置き換わる。
 *
 * @flow
 * 1. カウントダウン（3, 2, 1）の後にタイマー開始
 * 2. 制限時間経過またはミス上限で終了し、結果画面へ
 */
export default function PracticePlayPage() {
  return (
    <PracticeRoute
      render={(slug, screens) => (
        <PracticePlayScreen slug={slug} screens={screens} />
      )}
    />
  );
}
