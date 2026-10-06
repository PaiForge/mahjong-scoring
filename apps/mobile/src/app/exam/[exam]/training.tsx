import { ExamRoute } from "../../../practice/screens/exam-route";
import { PracticeTrainingScreen } from "../../../practice/screens/practice-play-screen";

/**
 * 昇級試験の模試
 *
 * @description
 * 本番と同じ出題を時間無制限・記録なしで、1 問ごとに答え合わせしながら解く。
 * 「終了する」で試験の説明へ戻る。
 */
export default function ExamTrainingPage() {
  return (
    <ExamRoute
      render={(slug, screens) => (
        <PracticeTrainingScreen slug={slug} screens={screens} />
      )}
    />
  );
}
