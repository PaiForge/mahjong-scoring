import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { ResultPageSkeleton } from "./result-page-skeleton";

/**
 * ランキングを持たない練習（昇級試験）でリーダーボードの枠を描くと、実体に
 * 替わった瞬間にページがその高さぶん縮む。旗の既定値と分岐だけを検査する。
 */
describe("ResultPageSkeleton のリーダーボード枠", () => {
  function renderSkeleton(hasLeaderboard?: boolean) {
    return render(
      <ResultPageSkeleton
        practiceTitle="x"
        breadcrumb={[]}
        {...(hasLeaderboard === undefined ? {} : { hasLeaderboard })}
      />,
    );
  }

  it("既定では枠を描く（ランキングを持つ練習）", () => {
    const { queryByTestId } = renderSkeleton();

    expect(queryByTestId("leaderboard-skeleton")).not.toBeNull();
  });

  it("hasLeaderboard が false なら枠を描かない", () => {
    const { queryByTestId } = renderSkeleton(false);

    expect(queryByTestId("leaderboard-skeleton")).toBeNull();
  });
});
