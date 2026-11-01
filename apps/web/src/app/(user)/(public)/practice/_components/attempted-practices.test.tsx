import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetSlugs } = vi.hoisted(() => ({ mockGetSlugs: vi.fn() }));

vi.mock(
  "@/app/_contexts/auth-context",
  async () => await import("@/test/auth-context-mock"),
);
vi.mock("../_actions/get-attempted-practice-slugs", () => ({
  getAttemptedPracticeSlugs: mockGetSlugs,
}));

const { useAuth: mockUseAuth } = await import("@/test/auth-context-mock");
const { AttemptedPracticesProvider, PracticeAttemptedMark } =
  await import("./attempted-practices");

function renderMarks() {
  return render(
    <AttemptedPracticesProvider>
      <PracticeAttemptedMark slug="yaku" label="挑戦済み" />
      <PracticeAttemptedMark slug="han-count" label="挑戦済み" />
    </AttemptedPracticesProvider>,
  );
}

describe("PracticeAttemptedMark", () => {
  beforeEach(() => {
    mockGetSlugs.mockReset();
    mockUseAuth.mockReturnValue({ user: undefined, isLoading: false });
  });
  afterEach(cleanup);

  it("ログイン中は挑戦した練習にだけ印を出す", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" }, isLoading: false });
    mockGetSlugs.mockResolvedValue(["yaku"]);
    const { container } = renderMarks();

    expect(await screen.findByText("挑戦済み")).toBeTruthy();
    expect(
      Array.from(container.querySelectorAll("[data-practice-attempted]")).map(
        (el) => el.getAttribute("data-practice-attempted"),
      ),
    ).toEqual(["yaku"]);
  });

  it("未ログインでは取りに行かず、印も出さない", () => {
    renderMarks();

    expect(mockGetSlugs).not.toHaveBeenCalled();
    expect(screen.queryByText("挑戦済み")).toBeNull();
  });

  it("プロバイダーの外では印を出さない", () => {
    render(<PracticeAttemptedMark slug="yaku" label="挑戦済み" />);

    expect(screen.queryByText("挑戦済み")).toBeNull();
  });
});
