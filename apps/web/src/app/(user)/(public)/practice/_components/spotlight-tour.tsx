"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { HelpTourButton } from "./help-tour-modal";

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
}

interface SpotlightTourProps {
  readonly steps: readonly SpotlightStep[];
  readonly labels: SpotlightTourLabels;
  /** 「?」の見た目（{@link HelpTourButton} と同じ） */
  readonly variant?: "title" | "inline";
}

/**
 * 実画面の要素を順に照らして説明するヘルプツアーの「?」ボタン
 * スポットライトツアー
 *
 * 押した時点で画面にある要素だけを案内する。対象が無い段階（別の段階で
 * しか出ない操作）は黙って飛ばすため、段階ごとに画面が変わる練習でも
 * 「今見えている操作」の説明になる。オーバーレイと吹き出しは driver.js が
 * body の直下に描くため、ページ遷移で取り残されないよう pathname が変わったら
 * 破棄する。
 *
 * 同じ「?」でも、開始前に流れを通しで見せるカルーセル
 * （{@link import("./help-tour-modal").HelpTourModal}）とは役割が違う。
 * こちらは解いている最中に「この操作は何か」を実物の上で答える。
 */
export function SpotlightTour({
  steps,
  labels,
  variant = "title",
}: SpotlightTourProps) {
  const driverRef = useRef<ReturnType<typeof driver> | undefined>(undefined);
  const pathname = usePathname();

  useEffect(() => {
    return () => {
      driverRef.current?.destroy();
      driverRef.current = undefined;
    };
  }, [pathname]);

  const startTour = () => {
    driverRef.current?.destroy();

    const resolved = steps.flatMap((step) => {
      const element = document.querySelector(
        `[data-tour-id="${step.targetId}"]`,
      );
      return element ? [{ step, element }] : [];
    });
    if (resolved.length === 0) return;

    const instance = driver({
      showProgress: resolved.length > 1,
      nextBtnText: labels.next,
      prevBtnText: labels.prev,
      doneBtnText: labels.done,
      steps: resolved.map(({ step, element }) => ({
        element,
        popover: {
          title: step.title,
          description: step.description,
          side: step.side ?? "bottom",
          align: step.align ?? "start",
        },
      })),
    });
    driverRef.current = instance;
    instance.drive();
  };

  return (
    <HelpTourButton
      onClick={startTour}
      label={labels.label}
      variant={variant}
    />
  );
}
