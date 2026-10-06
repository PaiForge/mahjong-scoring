import { PracticeIntroScreen } from "../../../practice/screens/practice-intro-screen";
import { PracticeRoute } from "../../../practice/screens/practice-route";

/**
 * 練習の説明
 *
 * @description
 * 問題方式の見本と、チャレンジ / トレーニングの開始導線。
 */
export default function PracticeIntroPage() {
  return (
    <PracticeRoute
      render={(slug, screens) => (
        <PracticeIntroScreen slug={slug} screens={screens} />
      )}
    />
  );
}
