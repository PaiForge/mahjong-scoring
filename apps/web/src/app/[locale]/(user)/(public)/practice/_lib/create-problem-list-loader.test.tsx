import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { packStoredResults } from "@mahjong-scoring/features/challenge/challenge-run";
import { createProblemListLoader } from "./create-problem-list-loader";

const KEY = "test-results";
const RUN = 1_700_000_000_000;

const parse = (stored: unknown): readonly string[] =>
  Array.isArray(stored) ? stored.map(String) : [];

function List({ results }: { readonly results: readonly string[] }) {
  return (
    <ul>
      {results.map((result) => (
        <li key={result}>{result}</li>
      ))}
    </ul>
  );
}

const Loader = createProblemListLoader(parse, List);

afterEach(() => {
  sessionStorage.clear();
});

describe("createProblemListLoader", () => {
  it("一覧の末尾に footer を出す", () => {
    sessionStorage.setItem(KEY, packStoredResults(RUN, ["一問目"]));

    render(
      <Loader
        storageKey={KEY}
        runId={RUN}
        expectedCount={1}
        footer={<button type="button">もう一度</button>}
      />,
    );

    expect(screen.getByText("一問目")).toBeTruthy();
    expect(screen.getByRole("button", { name: "もう一度" })).toBeTruthy();
  });

  it("一覧が空なら footer も出さない", () => {
    // 一覧が無いと、広告の直後にボタン群と同じボタンが並ぶだけになる
    sessionStorage.setItem(KEY, packStoredResults(RUN, ["一問目"]));

    render(
      <Loader
        storageKey={KEY}
        runId={RUN + 1}
        expectedCount={1}
        footer={<button type="button">もう一度</button>}
      />,
    );

    expect(screen.queryByRole("button", { name: "もう一度" })).toBeNull();
  });
});
