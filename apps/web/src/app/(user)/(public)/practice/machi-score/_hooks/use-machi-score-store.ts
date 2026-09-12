import { create } from "zustand";
import type {
  HaiKindId,
  JudgementResult,
  MachiCellAnswer,
  MachiCellJudgementMode,
  MachiScoreGeneratorOptions,
  MachiScoreQuestion,
  MachiSelectionJudgement,
} from "@mahjong-scoring/core";
import {
  generateValidMachiScoreQuestion,
  judgeMachiCellAnswer,
  judgeMachiSelection,
  machiCellKey,
  toYakumanRuleConfig,
} from "@mahjong-scoring/core";
import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";

/**
 * 解答の段階
 * 解答フェーズ
 *
 * - `machi`: 待ち牌を選ぶ。回答すると正誤を見せたまま同じ段階に留まり、
 *   「点数計算へ進む」で次へ
 * - `cells`: 待ち × ツモ/ロンのマスに点数を当てはめる
 * - `result`: 答え合わせ
 */
export type MachiScorePhase = "machi" | "cells" | "result";

/**
 * マス（待ち牌 1 つ × 和了方法 1 つ）の参照
 * マス参照
 */
export interface MachiCellRef {
  readonly agariHai: HaiKindId;
  readonly isTsumo: boolean;
}

/** マス参照からキーを引く（core の `machiCellKey` と同じ） */
export function cellKeyOf(cell: MachiCellRef): string {
  return machiCellKey(cell.agariHai, cell.isTsumo);
}

/** 出題のすべてのマス（待ちの並び順に、ツモ・ロンの順） */
export function listCellRefs(
  question: Readonly<MachiScoreQuestion>,
): readonly MachiCellRef[] {
  return question.waits.flatMap((wait) => [
    { agariHai: wait.agariHai, isTsumo: true },
    { agariHai: wait.agariHai, isTsumo: false },
  ]);
}

interface MachiScoreState {
  /** 現在の問題 */
  currentQuestion: MachiScoreQuestion | undefined;
  phase: MachiScorePhase;
  /**
   * 直近の生成が問題を作れずに終わったか（理由は総合演習のストアと同じ:
   * 盤面が「問題が無い」を生成前としか解釈しないため、失敗を別に持つ）
   */
  generationFailed: boolean;
  /** 出題ごとに増える連番。回答フォームの key に使い、次問題への遷移で入力をクリアする */
  questionSeq: number;
  /**
   * 列（ツモ / ロン）ごとの回答欄を作り直す連番。`assignAnswer` で当てはめた
   * 列だけ増え、盤面はこれを key にしてその列の入力を空に戻す
   *
   * 回答欄の入力は当てはめるまでどのマスにも入っていない。選択を解いたり
   * 別の列を押したりした拍子に欄ごと作り直すと、誤タップ 1 回で入力が
   * 失われるので、入力を捨ててよいのは「当てはめて回答がマスに移った」
   * ときと次の問題に進んだとき（`questionSeq`）に限る
   */
  draftSeq: Readonly<Record<"tsumo" | "ron", number>>;
  options: MachiScoreGeneratorOptions;
  /** 待ち牌として選んでいる牌 */
  selectedMachi: readonly HaiKindId[];
  /** 待ち牌の判定。回答するまで undefined */
  machiJudgement: MachiSelectionJudgement | undefined;
  /** 点数を当てはめる対象として選んでいるマス。同じ和了方法の列に限る */
  selectedCells: readonly MachiCellRef[];
  /** マスごとの回答（キーは `cellKeyOf`） */
  cellAnswers: Readonly<Record<string, MachiCellAnswer>>;
  /** マスごとの判定。答え合わせ前と「わからない」での開示では undefined */
  cellResults: Readonly<Record<string, JudgementResult>> | undefined;
  /** 直近の答え合わせで全体（待ち + 全マス）が正解だったか */
  isAllCorrect: boolean;
  stats: {
    total: number;
    correct: number;
  };
}

interface MachiScoreActions {
  generateNewQuestion: () => void;
  nextQuestion: () => void;
  setOptions: (options: Partial<MachiScoreGeneratorOptions>) => void;
  resetStats: () => void;
  /** 問題を直接設定する（設定画面へ戻る前のクリアなど） */
  setQuestion: (question: MachiScoreQuestion | undefined) => void;
  /** 待ち牌の選択を切り替える（判定後は変えられない） */
  toggleMachi: (hai: HaiKindId) => void;
  /** 待ち牌の選択を回答する。正誤に関わらず判定を残し、`proceedToCells` を待つ */
  submitMachi: () => void;
  /** 待ち牌の判定後、点数の回答へ進む */
  proceedToCells: () => void;
  /**
   * マスの選択を切り替える
   *
   * 回答済みのマスを押しても回答は消さない — 選択に入るだけで、置き換わる
   * のはその状態で `assignAnswer` したときだけ。押した瞬間に消す形だと
   * 誤タップ 1 回で入力が失われ、確認や鍵で守る羽目になる。ツモとロンでは
   * 回答の形（翻の有無・支払いの形）が違うため、別の列のマスを押すと
   * 選択をそちらへ移す（列をまたいでまとめて答えることはできない）。
   */
  toggleCell: (cell: MachiCellRef) => void;
  /** 選択中のマスすべてに同じ回答を当てはめ、選択を解く */
  assignAnswer: (answer: MachiCellAnswer) => void;
  /** 全マスの回答を判定して答え合わせへ進む */
  submitCells: (mode: MachiCellJudgementMode) => void;
  /**
   * 無回答のまま正解を開示する（「わからない」）
   *
   * 統計には入れない。待ちの判定前なら待ちも開示（判定は付けない）。
   */
  revealAnswer: () => void;
}

type MachiScoreStore = MachiScoreState & MachiScoreActions;

const INITIAL_ANSWERING: Pick<
  MachiScoreState,
  | "phase"
  | "selectedMachi"
  | "machiJudgement"
  | "selectedCells"
  | "cellAnswers"
  | "cellResults"
  | "isAllCorrect"
> = {
  phase: "machi",
  selectedMachi: [],
  machiJudgement: undefined,
  selectedCells: [],
  cellAnswers: {},
  cellResults: undefined,
  isAllCorrect: false,
};

/**
 * 待ち別点数計算のストア
 * 待ち別点数計算ストア
 *
 * 1 問の中に「待ち牌を選ぶ → マスに点数を当てはめる → 答え合わせ」の
 * 3 段階があるため、段階（{@link MachiScorePhase}）と段階ごとの入力を
 * まとめて持つ。問題を作り直すと入力はすべて初期化する。
 */
export const useMachiScoreStore = create<MachiScoreStore>((set, get) => ({
  currentQuestion: undefined,
  generationFailed: false,
  questionSeq: 0,
  draftSeq: { tsumo: 0, ron: 0 },
  options: {
    includeFuro: true,
    allowedRanges: ["nonMangan", "manganPlus"],
  },
  stats: { total: 0, correct: 0 },
  ...INITIAL_ANSWERING,

  generateNewQuestion: () => {
    const { options } = get();
    const rules = useRuleSettingsStore.getState();
    const question = generateValidMachiScoreQuestion({
      ...options,
      renfonpaiAs4Fu: rules.renfonpaiAs4Fu,
      kiriageMangan: rules.kiriageMangan,
      yakumanRules: toYakumanRuleConfig(rules),
    });
    set((state) => ({
      currentQuestion: question,
      generationFailed: question === undefined,
      questionSeq: state.questionSeq + 1,
      ...INITIAL_ANSWERING,
    }));
  },

  nextQuestion: () => {
    get().generateNewQuestion();
  },

  setOptions: (options) => {
    set((state) => ({ options: { ...state.options, ...options } }));
  },

  resetStats: () => {
    set({ stats: { total: 0, correct: 0 } });
  },

  setQuestion: (question) => {
    set((state) => ({
      currentQuestion: question,
      // 設定画面へ戻る前のクリア（setQuestion(undefined)）は失敗ではない
      generationFailed: false,
      questionSeq: state.questionSeq + 1,
      ...INITIAL_ANSWERING,
    }));
  },

  toggleMachi: (hai) => {
    const { phase, machiJudgement, selectedMachi } = get();
    if (phase !== "machi" || machiJudgement) return;
    set({
      selectedMachi: selectedMachi.includes(hai)
        ? selectedMachi.filter((h) => h !== hai)
        : [...selectedMachi, hai],
    });
  },

  submitMachi: () => {
    const { currentQuestion, phase, machiJudgement, selectedMachi } = get();
    if (!currentQuestion || phase !== "machi" || machiJudgement) return;
    set({
      machiJudgement: judgeMachiSelection(currentQuestion, selectedMachi),
    });
  },

  proceedToCells: () => {
    const { phase, machiJudgement } = get();
    if (phase !== "machi" || !machiJudgement) return;
    set({ phase: "cells" });
  },

  toggleCell: (cell) => {
    const { phase, selectedCells } = get();
    if (phase !== "cells") return;
    const key = cellKeyOf(cell);

    if (selectedCells.some((c) => cellKeyOf(c) === key)) {
      set({ selectedCells: selectedCells.filter((c) => cellKeyOf(c) !== key) });
      return;
    }

    const sameColumn = selectedCells.every((c) => c.isTsumo === cell.isTsumo);
    set({ selectedCells: sameColumn ? [...selectedCells, cell] : [cell] });
  },

  assignAnswer: (answer) => {
    const { phase, selectedCells, cellAnswers, draftSeq } = get();
    if (phase !== "cells" || selectedCells.length === 0) return;
    const next: Record<string, MachiCellAnswer> = { ...cellAnswers };
    for (const cell of selectedCells) next[cellKeyOf(cell)] = answer;
    // 選択中のマスは同じ列に限られる（toggleCell が保証する）
    const column = selectedCells[0].isTsumo ? "tsumo" : "ron";
    set({
      cellAnswers: next,
      selectedCells: [],
      draftSeq: { ...draftSeq, [column]: draftSeq[column] + 1 },
    });
  },

  submitCells: (mode) => {
    const { currentQuestion, phase, cellAnswers, machiJudgement, stats } =
      get();
    if (!currentQuestion || phase !== "cells") return;

    const results: Record<string, JudgementResult> = {};
    let allCellsCorrect = true;
    for (const wait of currentQuestion.waits) {
      for (const isTsumo of [true, false]) {
        const key = machiCellKey(wait.agariHai, isTsumo);
        const answer = cellAnswers[key];
        // 未回答のマスは答えていないので不正解扱い（画面は全マス回答まで
        // 送信させないため、通常ここには来ない）
        const result = answer
          ? judgeMachiCellAnswer(isTsumo ? wait.tsumo : wait.ron, answer, mode)
          : judgeMachiCellAnswer(wait.tsumo, { kind: "noYaku" }, mode);
        results[key] = result;
        if (!result.isCorrect) allCellsCorrect = false;
      }
    }

    const isAllCorrect =
      (machiJudgement?.isCorrect ?? false) && allCellsCorrect;
    set({
      phase: "result",
      cellResults: results,
      selectedCells: [],
      isAllCorrect,
      stats: {
        total: stats.total + 1,
        correct: stats.correct + (isAllCorrect ? 1 : 0),
      },
    });
  },

  revealAnswer: () => {
    const { currentQuestion, phase } = get();
    if (!currentQuestion || phase === "result") return;
    set({
      phase: "result",
      selectedCells: [],
      cellResults: undefined,
      isAllCorrect: false,
    });
  },
}));
