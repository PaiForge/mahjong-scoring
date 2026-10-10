import { ExamResultScreen } from "../../../practice/screens/exam-result-screen";
import { ExamRoute } from "../../../practice/screens/exam-route";

/**
 * 昇級試験の結果
 *
 * @description
 * 直前の試験の合否・合格ラインまでの進み具合・付与された段級位・問題別の結果。
 */
export default function ExamResultPage() {
  return (
    <ExamRoute
      render={(slug, screens) => (
        <ExamResultScreen slug={slug} screens={screens} />
      )}
    />
  );
}
