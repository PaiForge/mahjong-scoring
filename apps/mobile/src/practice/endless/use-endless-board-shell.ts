import { useEffect, useRef, useState } from "react";
import { useRouter, type Href } from "expo-router";
import type { ScrollView } from "react-native";
import { useTranslations } from "use-intl";
import type { PracticeQuotaGate } from "@mahjong-scoring/features/quota/gate";
import type { QuotaMenu } from "@mahjong-scoring/features/quota/limits";

import { showToast } from "../../components/toast";
import { useJudgementHaptics } from "../../hooks/use-judgement-haptics";
import { useAutoAdvanceOnCorrect } from "../../hooks/use-training-settings-store";
import { usePracticeQuota } from "../quota/use-practice-quota";

interface EndlessBoardShellOptions {
  /** 回数制限の単位 */
  readonly menu: QuotaMenu;
  /** 「終了する」で戻る設定画面 */
  readonly exitHref: Href;
  /** 終えたことを知らせるトースト（この練習の文言） */
  readonly exitToast: string;
  /** 正誤の成績（触覚の合図に使う） */
  readonly stats: { readonly correct: number; readonly total: number };
  /** 回数制限が許可したときに問題を作る（練習ストアの `generateNewQuestion`） */
  readonly generate: () => void;
  /**
   * 盤面を開いたとき、最初の問題の前に出題条件をストアへ移す（成績と前回の
   * 問題も消える）。参照が変わると最初の問題を作り直すので、`useCallback` で
   * 設定だけに依存させる
   */
  readonly start: () => void;
  /** 「わからない」で正解を開示する（練習ストアの `revealAnswer`） */
  readonly revealAnswer: () => void;
}

interface EndlessBoardShell {
  /** 盤面のスクロール（`Screen` の ref） */
  readonly scrollRef: React.RefObject<ScrollView | null>;
  /** 盤面の先頭へ戻す。回答・開示・次へのたびに呼ぶ */
  readonly scrollToTop: () => void;
  /** 正解で自動で次へ進んだ合図（`CorrectFlash` の signal） */
  readonly flashSignal: number;
  /** 正解で自動で次へ進む設定か */
  readonly autoAdvanceOnCorrect: boolean;
  /** 回数制限の返事を待っている間 true */
  readonly isChecking: boolean;
  /** 直近の回数制限の結果 */
  readonly gate: PracticeQuotaGate | undefined;
  /** 終えたことを知らせてから設定画面へ戻す */
  readonly handleBackToSetup: () => void;
  /** 次の問題へ（返事を待っている間は無視） */
  readonly handleNext: () => void;
  /** 正解を開示する */
  readonly handleReveal: () => void;
  /** 正解の合図を出して次の問題へ（自動で次へ進むとき） */
  readonly celebrateAndAdvance: () => void;
}

/**
 * 無限訓練の盤面に共通の配線
 * 無限訓練盤面シェル
 *
 * 和了形・聴牌形の点数計算の盤面が同じ順で持つもの — 回数制限のゲート
 * （{@link usePracticeQuota}）、レート制限のトースト、正誤の触覚、開いたときの
 * 最初の問題、先頭へ戻すスクロール、戻る・次へ・開示・自動で次への操作 — を
 * 1 つにまとめる。出題条件の組み方・段階の切り替え・回答の受け付けは各盤面が持つ。
 */
export function useEndlessBoardShell({
  menu,
  exitHref,
  exitToast,
  stats,
  generate,
  start,
  revealAnswer,
}: EndlessBoardShellOptions): EndlessBoardShell {
  const tq = useTranslations("practiceQuota");
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const autoAdvanceOnCorrect = useAutoAdvanceOnCorrect();
  const [flashSignal, setFlashSignal] = useState(0);
  // 問題の生成は回数制限の許可を挟む。生成そのものは今までどおり端末のストアが行う
  const { requestQuestion, requestFirstQuestion, isChecking, gate } =
    usePracticeQuota(menu, generate);

  useEffect(() => {
    if (gate?.kind === "rateLimited") showToast(tq("rateLimited"));
  }, [gate, tq]);

  useJudgementHaptics(stats.correct, stats.total - stats.correct);

  // 出題条件をストアへ移し、成績と前回の問題を消してから最初の問題を作る
  useEffect(() => {
    start();
    void requestFirstQuestion();
  }, [start, requestFirstQuestion]);

  // 回答・開示・次へのボタンは縦に長い盤面の下端にあるので、押すたびに先頭へ戻す
  const scrollToTop = () =>
    scrollRef.current?.scrollTo({ y: 0, animated: false });

  // 終えたことを知らせてから設定画面へ戻す（web と同じ。文言はこの練習のもの —
  // チャレンジでもトレーニングでもないため）
  const handleBackToSetup = () => {
    router.dismissTo(exitHref);
    showToast(exitToast);
  };

  const handleNext = () => {
    if (isChecking) return;
    scrollToTop();
    void requestQuestion();
  };

  const handleReveal = () => {
    scrollToTop();
    revealAnswer();
  };

  const celebrateAndAdvance = () => {
    setFlashSignal((prev) => prev + 1);
    void requestQuestion();
  };

  return {
    scrollRef,
    scrollToTop,
    flashSignal,
    autoAdvanceOnCorrect,
    isChecking,
    gate,
    handleBackToSetup,
    handleNext,
    handleReveal,
    celebrateAndAdvance,
  };
}
