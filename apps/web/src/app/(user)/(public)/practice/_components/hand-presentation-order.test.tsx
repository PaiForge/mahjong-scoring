/**
 * 手牌を理牌せずに表示する（Pro）の盤面の並び
 *
 * @description
 * 保存値 → HandPresentationProvider → コンテキスト → TehaiDisplay → TehaiHand の結線を、
 * 描いた牌の順序そのもので確かめる。どこかで `presentation` を渡し忘れたり
 * `sorted` を直書きしたりすると、理牌の順に戻って落ちる。
 *
 * 実行環境の種は `Math.random` を固定して決める（features の
 * `use-hand-presentation.ts` が最初の確定で 1 度だけ採る）。
 */
import { act, screen, waitFor } from "@testing-library/react";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { HaiKind, type ScoreQuestion } from "@mahjong-scoring/core";
import { splitAgariHai } from "@mahjong-scoring/features/board/agari-hai";
import {
  buildHandPresentation,
  presentTehai,
} from "@mahjong-scoring/features/board/hand-presentation";
import { tehaiContextOf } from "@mahjong-scoring/features/board/score-question-context";
import { buildDemoTehai } from "@mahjong-scoring/features/board/demo-tehai";
import { exampleMinkou } from "@mahjong-scoring/features/board/example-mentsu";
import { TENPAI_SCORE_DEMO_QUESTION } from "@mahjong-scoring/features/practice/tenpai-score/demo-question";
import { getHaiName } from "@pai-forge/mahjong-react-ui";

import { publicChallengeQuestion } from "@/lib/challenge/questions";
import {
  PRESENTATION_CLOSED,
  PRESENTATION_CONTEXT,
  proViewerProfile,
} from "@/test/hand-presentation-fixtures";
import { render } from "@/test/tile-image-render";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));
vi.mock(
  "@/app/_contexts/auth-context",
  async () => await import("@/test/auth-context-mock"),
);
vi.mock("@/app/_lib/viewer-profile", () => ({
  fetchViewerProfile: vi.fn(),
}));

const { useAuth } = await import("@/test/auth-context-mock");
const { fetchViewerProfile } = await import("@/app/_lib/viewer-profile");
const { useDisplaySettingsStore } =
  await import("@/app/_hooks/use-display-settings-store");
const { HandPresentationProvider } =
  await import("./hand-presentation-provider");
const { TehaiDisplay } = await import("./tehai-display");
const { TenpaiDisplay } =
  await import("../tenpai-score/_components/tenpai-display");

/** `Math.random` を 0.5 に固定したときの実行環境の種 */
const SESSION_SEED = 0x80000000;

/** 理牌の順の純手牌（和了牌の中を 1 枚抜いたもの） */
const SORTED_NAMES = PRESENTATION_CLOSED.slice(0, 13).map((hai) =>
  getHaiName(hai),
);

/**
 * 固定の種で理牌しないときの並び（期待値は計算ではなく書き出した値）
 *
 * 理牌の順と違うことも確かめる（偶然恒等置換になる種を選んでいない）。
 */
const UNSORTED_NAMES = [
  "四筒",
  "五筒",
  "二萬",
  "東",
  "七索",
  "東",
  "一萬",
  "東",
  "六筒",
  "中",
  "三萬",
  "九索",
  "八索",
];

/** 盤面に描かれた牌の名前（左から。純手牌 → 和了牌 → 副露） */
function tileNames(): string[] {
  return screen.getAllByRole("img").map((img) => img.getAttribute("alt") ?? "");
}

/** Provider を通して盤面を描き、見せ方が決まるまで待つ */
async function renderBoard(ui: React.ReactElement) {
  const view = render(
    <HandPresentationProvider fallback={<p>skeleton</p>}>
      {ui}
    </HandPresentationProvider>,
  );
  await waitFor(() => expect(screen.queryByText("skeleton")).toBeNull());
  return view;
}

function wrap(ui: React.ReactElement) {
  return (
    <HandPresentationProvider fallback={<p>skeleton</p>}>
      {ui}
    </HandPresentationProvider>
  );
}

beforeAll(() => {
  vi.spyOn(Math, "random").mockReturnValue(0.5);
});

afterAll(() => {
  vi.mocked(Math.random).mockRestore();
});

beforeEach(() => {
  useAuth.mockReturnValue({ user: { id: "u1" }, isLoading: false });
  vi.mocked(fetchViewerProfile).mockReset();
  vi.mocked(fetchViewerProfile).mockResolvedValue(proViewerProfile());
  act(() => {
    useDisplaySettingsStore.getState().setTileOrientation("upright");
    useDisplaySettingsStore.getState().setTileOrder("unsorted");
  });
});

describe("理牌しない盤面の並び（web）", () => {
  it("期待値は固定の種での計算と一致し、理牌の順とは違う", () => {
    const split = splitAgariHai(
      PRESENTATION_CLOSED,
      PRESENTATION_CONTEXT.agariHai,
    );
    const presented = presentTehai(
      split,
      buildHandPresentation(split, {
        orientation: "upright",
        order: "unsorted",
        sessionSeed: SESSION_SEED,
      }),
    );
    expect(presented.closed.map((tile) => getHaiName(tile.hai))).toEqual(
      UNSORTED_NAMES,
    );
    expect(UNSORTED_NAMES).not.toEqual(SORTED_NAMES);
  });

  it("保存値 unsorted + Pro なら純手牌をその順で並べ、和了牌は右に分けたまま", async () => {
    await renderBoard(
      <TehaiDisplay
        tehai={{ closed: PRESENTATION_CLOSED, exposed: [] }}
        context={PRESENTATION_CONTEXT}
      />,
    );
    expect(tileNames()).toEqual([...UNSORTED_NAMES, "中"]);
    // 和了牌のラベル（ツモ）は和了牌のそばに残る
    expect(screen.getByText("tsumo")).toBeTruthy();
  });

  it("向きを random にしても並びは変わらない", async () => {
    act(() => useDisplaySettingsStore.getState().setTileOrientation("random"));
    await renderBoard(
      <TehaiDisplay
        tehai={{ closed: PRESENTATION_CLOSED, exposed: [] }}
        context={PRESENTATION_CONTEXT}
      />,
    );
    expect(tileNames()).toEqual([...UNSORTED_NAMES, "中"]);
  });

  it("副露は鳴いた順のまま、純手牌だけ並べ直す", async () => {
    // 2副露を牌種の理牌順とは逆に置き、順序の入れ替えも検出する。
    const tehai = buildDemoTehai(
      [...PRESENTATION_CLOSED.slice(0, 6), HaiKind.Chun, HaiKind.Chun],
      [exampleMinkou(HaiKind.Haku), exampleMinkou(HaiKind.Ton)],
    );
    await renderBoard(
      <TehaiDisplay tehai={tehai} context={PRESENTATION_CONTEXT} />,
    );
    const names = tileNames();
    expect(names.slice(-6)).toEqual(["白", "白", "白", "東", "東", "東"]);
    expect(names[7]).toBe("中");
    expect([...names.slice(0, 7)].sort()).toEqual(
      splitAgariHai(tehai.closed, PRESENTATION_CONTEXT.agariHai)
        .closedTiles.map((hai) => getHaiName(hai))
        .sort(),
    );
  });

  it("特典が無ければ理牌の順", async () => {
    vi.mocked(fetchViewerProfile).mockResolvedValue({
      ...proViewerProfile(),
      benefits: [],
    });
    await renderBoard(
      <TehaiDisplay
        tehai={{ closed: PRESENTATION_CLOSED, exposed: [] }}
        context={PRESENTATION_CONTEXT}
      />,
    );
    expect(tileNames()).toEqual([...SORTED_NAMES, "中"]);
  });

  it("Provider の外では保存値に関わらず理牌の順", () => {
    render(
      <TehaiDisplay
        tehai={{ closed: PRESENTATION_CLOSED, exposed: [] }}
        context={PRESENTATION_CONTEXT}
      />,
    );
    expect(tileNames()).toEqual([...SORTED_NAMES, "中"]);
  });

  it("同じ値の別オブジェクトで描き直しても並びは変わらない", async () => {
    const view = await renderBoard(
      <TehaiDisplay
        tehai={{ closed: PRESENTATION_CLOSED, exposed: [] }}
        context={PRESENTATION_CONTEXT}
      />,
    );
    const before = tileNames();
    view.rerender(
      wrap(
        <TehaiDisplay
          tehai={{ closed: [...PRESENTATION_CLOSED], exposed: [] }}
          context={{ ...PRESENTATION_CONTEXT }}
        />,
      ),
    );
    expect(tileNames()).toEqual(before);
  });

  it("聴牌形（tenpai-score）は裏ドラを開いても並びが変わらない", async () => {
    const question = TENPAI_SCORE_DEMO_QUESTION;
    const sortedNames = question.tehai.closed.map((hai) => getHaiName(hai));
    const view = await renderBoard(
      <TenpaiDisplay question={question} showUraDora={false} />,
    );
    const handBefore = tileNames().filter((name) => sortedNames.includes(name));
    expect(handBefore).not.toEqual(sortedNames);
    view.rerender(wrap(<TenpaiDisplay question={question} showUraDora />));
    const handAfter = tileNames().filter((name) => sortedNames.includes(name));
    expect(handAfter).toEqual(handBefore);
  });

  it("記録付きチャレンジで公開問題から採点済みの問題へ差し替えても並びは変わらない", async () => {
    const answered = TENPAI_SCORE_DEMO_QUESTION.waits[0]?.ron;
    if (answered === undefined) throw new Error("固定問題に待ちがない");
    const hidden = publicChallengeQuestion(answered, "score_calculation");
    const board = (question: ScoreQuestion) => (
      <TehaiDisplay tehai={question.tehai} context={tehaiContextOf(question)} />
    );
    if (!("isTsumo" in hidden) || !("tehai" in hidden)) {
      throw new Error("点数の問題ではない");
    }
    const view = await renderBoard(board(hidden));
    const before = tileNames();
    view.rerender(wrap(board(answered)));
    expect(tileNames()).toEqual(before);
  });
});
