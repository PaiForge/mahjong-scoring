import { PracticeTrainingScreen } from "../../../practice/screens/practice-play-screen";
import { PracticeRoute } from "../../../practice/screens/practice-route";

/**
 * 練習のトレーニング
 *
 * @description
 * 時間無制限・記録なしで、1 問ごとに答え合わせしながら反復する。
 */
export default function PracticeTrainingPage() {
  return (
    <PracticeRoute
      render={(slug, screens) => (
        <PracticeTrainingScreen slug={slug} screens={screens} />
      )}
    />
  );
}
