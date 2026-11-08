import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { ResultPageSkeleton } from "./result-page-skeleton";

/**
 * 昇級試験の結果ページに無い枠（記録の節・ランキング）を描くと、実体に
 * 替わった瞬間にページがその高さぶん縮む。variant の既定値と分岐を検査する。
 */
describe("ResultPageSkeleton の variant", () => {
  function renderSkeleton(variant?: "practice" | "exam") {
    return render(
      <ResultPageSkeleton
        practiceTitle="x"
        breadcrumb={[]}
        {...(variant === undefined ? {} : { variant })}
      />,
    );
  }

  it("既定（練習）は記録の節とランキングの枠を描く", () => {
    const { queryByTestId } = renderSkeleton();

    expect(queryByTestId("result-block-skeleton")).not.toBeNull();
    expect(queryByTestId("leaderboard-skeleton")).not.toBeNull();
  });

  it("試験は記録の節とランキングの枠を描かない", () => {
    const { queryByTestId } = renderSkeleton("exam");

    expect(queryByTestId("result-block-skeleton")).toBeNull();
    expect(queryByTestId("leaderboard-skeleton")).toBeNull();
  });
});
