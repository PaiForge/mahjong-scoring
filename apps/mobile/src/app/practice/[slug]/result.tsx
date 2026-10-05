import { PracticeResultScreen } from "../../../practice/screens/practice-result-screen";
import { PracticeRoute } from "../../../practice/screens/practice-route";

/**
 * 練習の結果
 *
 * @description
 * 直前のチャレンジの正解数と問題別の結果。
 */
export default function PracticeResultPage() {
  return (
    <PracticeRoute
      render={(slug, screens) => (
        <PracticeResultScreen slug={slug} screens={screens} />
      )}
    />
  );
}
