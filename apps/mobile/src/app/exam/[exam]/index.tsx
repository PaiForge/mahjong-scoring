import { ExamIntroScreen } from "../../../practice/screens/exam-intro-screen";
import { ExamRoute } from "../../../practice/screens/exam-route";

/**
 * 昇級試験の説明
 *
 * @description
 * 問題方式の見本・合格条件・本番と模試の開始導線・前提となるレッスン・
 * その級の練習メニュー。本番はアカウント（ユーザー名を決めた人）が要り、
 * 受けられないときは開始ボタンの位置に登録・ユーザー名の設定・道場への導線を出す。
 *
 * @flow
 * 1. 道場の級カード・級の詳細の「試験の内容を見る」から遷移
 * 2. 「スタート」で本番へ、「模試を受ける」で模試へ
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
