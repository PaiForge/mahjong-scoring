"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { usePathname } from "next/navigation";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { safeLocalStorage } from "@/lib/safe-storage";

import { HelpIconButton } from "./help-icon-button";

/**
 * 画面上の要素を順に照らして説明する 1 段階
 * スポットライトの段階
 */
export interface SpotlightStep {
  /** 対象要素の `data-tour-id` の値 */
  readonly targetId: string;
  readonly title?: string;
  /** 1〜2 文の短い説明。長い文章は読まれない */
  readonly description: string;
  readonly side?: "top" | "bottom" | "left" | "right";
  readonly align?: "start" | "center" | "end";
}

interface SpotlightTourLabels {
  /** 起動ボタンの aria-label */
  readonly label: string;
  readonly prev: string;
  readonly next: string;
  readonly done: string;
  /**
   * 進捗の表示（「2 / 4」）。driver.js の雛形の `{{current}}` / `{{total}}` を
   * 含む文字列を渡す。省略すると driver.js 既定の英語（「2 of 4」）になるので必須
   */
  readonly progress: string;
}

/**
 * ツアーの名前空間からボタンの文言を組み立てる
 * スポットライトツアーの文言
 *
 * 名前空間に `label` / `prev` / `next` / `done` / `progress` を持つ前提。
 * `progress` には driver.js が差し込む雛形をそのまま値として渡す（ICU の
 * 波括弧と衝突するので辞書には書けない）。
 *
 * @param t - ツアーの名前空間（`dojo.tour` 等）の翻訳関数
 */
export function spotlightTourLabels(
  t: (key: string, values?: Record<string, string>) => string,
): SpotlightTourLabels {
  return {
    label: t("label"),
    prev: t("prev"),
    next: t("next"),
    done: t("done"),
    progress: t("progress", {
      current: "{{current}}",
      total: "{{total}}",
    }),
  };
}

interface SpotlightTourProps {
  readonly steps: readonly SpotlightStep[];
  readonly labels: SpotlightTourLabels;
  /**
   * 渡すと、この端末で初めて開いたときに一度だけ自動で始める
   *
   * 「?」が最初の画面に入らないページ（開いた直後に盤面へスクロールする
   * 早見表の連動サンプル）で使う。値は localStorage のキーで、実際に始めた
   * 時点で印を書き、2 回目からは始めない（見たいときは「?」から開く）。毎回
   * 始めると、知っている人には閉じる手間が増えるだけになる。始めるのは
   * {@link AUTO_START_DELAY_MS} 後で、盤面へのスクロール
   * （`useScrollToElement` の 100ms）が済んでから照らす
   */
  readonly autoStartOnceKey?: string;
}

/** 自動で始めるまでの待ち。盤面へのスクロールの後に照らすため */
const AUTO_START_DELAY_MS = 300;

/**
 * 実画面の要素を順に照らして説明するヘルプツアーの「?」ボタン
 * スポットライトツアー
 *
 * 押した時点で画面にある要素だけを案内する。対象が無い段階（別の段階で
 * しか出ない操作・その人の状態では描かれない要素）は黙って飛ばすため、
 * 段階ごとに画面が変わる練習でも「今見えている操作」の説明になる。
 * 練習の play 画面と、読む画面の見方の説明（道場）で使う。オーバーレイと吹き出しは driver.js が
 * body の直下に描くため、ページ遷移で取り残されないよう pathname が変わったら
 * 破棄する。
 *
 * 同じ「?」でも、練習の開始前に流れを通しで見せるカルーセル
 * （practice/_components の `HelpTourModal`）とは役割が違う。
 * こちらは解いている最中に「この操作は何か」を実物の上で答える。
 */
export function SpotlightTour({
  steps,
  labels,
  autoStartOnceKey,
}: SpotlightTourProps) {
  const driverRef = useRef<ReturnType<typeof driver> | undefined>(undefined);
  const pathname = usePathname();

  useEffect(() => {
    return () => {
      driverRef.current?.destroy();
      driverRef.current = undefined;
    };
  }, [pathname]);

  /** ツアーを始める。照らす要素が 1 つも無ければ始めず false を返す */
  const startTour = (): boolean => {
    driverRef.current?.destroy();

    const resolved = steps.flatMap((step) => {
      const element = document.querySelector(
        `[data-tour-id="${step.targetId}"]`,
      );
      return element ? [{ step, element }] : [];
    });
    if (resolved.length === 0) return false;

    // 照らした要素を押したら、ツアーを閉じてその操作を通す。driver.js は
    // ツアーの間、照らした要素と吹き出し以外を押せなくし（`.driver-active *`
    // に pointer-events: none）、暗幕を z-index 10000 で描く。閉じずにおくと、
    // 押して開いたモーダル（z-50）が暗幕の下に出て、ツアーを終えるまで
    // 操作できない。捕捉の段階で閉じるので、押した要素の処理より先に外れる
    const closeOnActiveClick = (event: MouseEvent) => {
      const active = instance.getActiveElement();
      if (
        active !== undefined &&
        event.target instanceof Node &&
        active.contains(event.target)
      ) {
        instance.destroy();
      }
    };

    const instance = driver({
      showProgress: resolved.length > 1,
      nextBtnText: labels.next,
      prevBtnText: labels.prev,
      doneBtnText: labels.done,
      progressText: labels.progress,
      steps: resolved.map(({ step, element }) => ({
        element,
        popover: {
          title: step.title,
          description: step.description,
          side: step.side ?? "bottom",
          align: step.align ?? "start",
        },
      })),
      onDestroyed: () => {
        document.removeEventListener("click", closeOnActiveClick, true);
      },
    });
    driverRef.current = instance;
    document.addEventListener("click", closeOnActiveClick, true);
    instance.drive();
    return true;
  };

  const startTourOnMount = useEffectEvent(startTour);

  useEffect(() => {
    if (autoStartOnceKey === undefined) return;
    if (safeLocalStorage.getItem(autoStartOnceKey) !== null) return;
    const timer = setTimeout(() => {
      // 待つ間にモーダルを開いていたら、その上に暗幕を重ねない。印も書かず、
      // 次に開いたときに改めて始める
      if (document.querySelector('[role="dialog"]') !== null) return;
      // 印は実際に始めたときだけ書く。照らす要素が無くて始まらなかったのに
      // 書くと、一度も見ないまま 2 回目から始まらなくなる
      if (startTourOnMount()) {
        safeLocalStorage.setItem(autoStartOnceKey, "1");
      }
    }, AUTO_START_DELAY_MS);
    return () => clearTimeout(timer);
  }, [autoStartOnceKey]);

  return <HelpIconButton onClick={() => startTour()} label={labels.label} />;
}
