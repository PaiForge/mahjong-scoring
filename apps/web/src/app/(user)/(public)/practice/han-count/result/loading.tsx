import { createPracticeResultLoading } from "../../_lib/create-practice-result-loading";

/**
 * 結果ページの読み込み中スケルトン。
 * namespace / slug は同ディレクトリの page.tsx と揃える。
 */
export default createPracticeResultLoading({
  slug: "han-count",
  namespace: "hanCountChallenge",
});
