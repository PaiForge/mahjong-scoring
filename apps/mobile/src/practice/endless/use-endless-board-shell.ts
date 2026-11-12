import { use, useCallback, useEffect, useRef, useState } from "react";
import { Platform, type ScrollViewInstance } from "react-native";
import { HeaderHeightContext } from "expo-router/react-navigation";
import { useTranslations } from "use-intl";
import type { PracticeQuotaGate } from "@mahjong-scoring/features/quota/gate";
import type { QuotaMenu } from "@mahjong-scoring/features/quota/limits";

import { showToast } from "../../components/toast";
import { useCloseSession } from "../../hooks/use-close-session";
import { useJudgementHaptics } from "../../hooks/use-judgement-haptics";
import { useAutoAdvanceOnCorrect } from "../../hooks/use-training-settings-store";
import { usePracticeQuota } from "../quota/use-practice-quota";

/**
 * 盤面が表示を切り替えたときに本文を先頭へ戻す
 * 盤面の先頭へ戻す
 *
 * iOS では解答中の画面のヘッダーが透け、本文はその下へ潜る。OS がヘッダーの
 * 高さぶんの inset を付けるので、先頭の位置は `y: 0` ではなくその高さぶん負の
 * 値になる（`y: 0` へ戻すと、本文の頭がヘッダーの裏に潜った位置で止まる）。
 * 解答中の画面は見出しを持ち `stickyHeaderIndices` を使わない（ヘッダーが透ける）
 * ので、ヘッダーの高さをそのまま使う。Android はヘッダーを透けさせないので 0。
 *
 * 同じ処理を `create-practice-views.tsx`
 * にも持つ（重複）。先頭の位置は `Screen` が付ける inset で決まるので、後で
 * `Screen` 側に「先頭へ戻す」を持たせて寄せる候補。
 */
function useScrollToTop() {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const headerHeight = use(HeaderHeightContext) ?? 0;
  const top = Platform.OS === "ios" ? -headerHeight : 0;
  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: top, animated: false });
  }, [top]);
  return { scrollRef, scrollToTop };
}

interface EndlessBoardShellOptions {
  /** 回数制限の単位 */
  readonly menu: QuotaMenu;
  /**
   * 「終了する」で見せる設定画面。モーダルを閉じて下の画面へ戻り、下に何も
   * 無いときだけここへ置き換える（`useCloseSession`）
   */
  readonly exitHref: string;
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
  readonly scrollRef: React.RefObject<ScrollViewInstance | null>;
  /**
   * 盤面の先頭へ戻す。回答・開示・次へのたびに呼ぶ（それらのボタンは縦に長い
   * 盤面の下端にあるため）
   */
  readonly scrollToTop: () => void;
  /** 正解で自動で次へ進んだ合図（`CorrectFlash` の signal） */
  readonly flashSignal: number;
  /** 正解で自動で次へ進む設定か */
  readonly autoAdvanceOnCorrect: boolean;
  /** 回数制限の返事を待っている間 true */
  readonly isChecking: boolean;
  /** 直近の回数制限の結果 */
  readonly gate: PracticeQuotaGate | undefined;
  /** 終えたことを知らせてから盤面のモーダルを閉じる（下の設定画面へ戻る） */
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
  const closeSession = useCloseSession(exitHref);
  const { scrollRef, scrollToTop } = useScrollToTop();
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

  // 終えたことを知らせてから盤面のモーダルを閉じる（web と同じ。文言はこの練習のもの —
  // チャレンジでもトレーニングでもないため）
  const handleBackToSetup = () => {
    closeSession();
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
