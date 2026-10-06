import { ExamIntroScreen } from "../../../practice/screens/exam-intro-screen";
import { ExamRoute } from "../../../practice/screens/exam-route";

/**
 * 昇級試験の説明
 *
 * @description
 * 問題方式の見本・合格条件・模試の開始導線・前提となるレッスン・その級の
 * 練習メニュー。本番の試験はアカウントが要るためモバイルでは開かない。
 *
 * @flow
 * 1. 道場の級カード・級の詳細の「試験の内容を見る」から遷移
 * 2. 「模試を受ける」で模試へ
 */
export default function ExamIntroPage() {
  return (
    <ExamRoute
      render={(slug, screens) => (
        <ExamIntroScreen slug={slug} screens={screens} />
      )}
    />
  );
}
