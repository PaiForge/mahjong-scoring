import { ExamRoute } from "../../../practice/screens/exam-route";
import { PracticePlayScreen } from "../../../practice/screens/practice-play-screen";

/**
 * 昇級試験の本番
 *
 * @description
 * 制限時間とミス上限のある試験。サーバーで採点し、終わると合否を判定して
 * 合格なら段級位を付与する（web の `/exam/<級>/play` と同じ）。記録付きで
 * 始められない（ゲスト・ユーザー名を決める前・受験資格が無い）ときは説明画面へ戻る。
 *
 * @flow
 * 1. 試験の説明の「スタート」から遷移
 * 2. カウントダウン（3, 2, 1）の後にタイマー開始
 * 3. 合格ラインに届く・制限時間経過・ミス上限で終了し、結果画面へ
 */
export default function ExamPlayPage() {
  return (
    <ExamRoute
      render={(slug, screens) => (
        <PracticePlayScreen slug={slug} screens={screens} />
      )}
    />
  );
}
