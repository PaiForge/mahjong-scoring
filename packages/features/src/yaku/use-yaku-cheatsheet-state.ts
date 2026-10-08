"use client";

import { useCallback, useMemo, useState } from "react";

import { resolveYakuCheatsheetName } from "./examples";

/** 役一覧の開閉と、どの役に送って開くかの状態 */
export interface YakuCheatsheetState {
  /** 一覧内で印を付ける成立役（早見表の項目名に解決済み） */
  readonly markedYakuNames: readonly string[];
  /** 開いたときに送る項目名。`undefined` なら一覧の先頭 */
  readonly focusedYakuName: string | undefined;
  readonly isOpen: boolean;
  /**
   * その役を押して役一覧を開けるか。早見表に例示手牌を持たない役（立直・
   * 門前清自摸和などの状況役・ドラ）は開いても見るものが無いため false
   */
  readonly canOpenYakuCheatsheet: (yakuName: string) => boolean;
  /**
   * 早見表の項目名（解決済み）まで送って開く。`undefined` なら先頭から開く。
   * 点数計算の役名からの解決と、解決できなかったときの扱いは呼び出し側が決める
   */
  readonly openAt: (focusedYakuName: string | undefined) => void;
  readonly close: () => void;
}

/**
 * 答え合わせから役一覧を開くための状態
 * 役一覧開閉状態
 *
 * 役判定の対比・翻数の内訳・和了形の点数計算の結果表示で共有する。点数計算が返す
 * 役名（「役牌 白」等）から早見表の項目名への解決と、成立役への印の組み立てを
 * ここに寄せ、画面ごとに別の役へ着地しないようにする。一覧の本体（web の
 * モーダル・アプリのシート）は各アプリが描く。
 *
 * @param yakuNames - この手で成立している役名。一覧内で印を付ける
 */
export function useYakuCheatsheetState(
  yakuNames: readonly string[],
): YakuCheatsheetState {
  const [focusedYakuName, setFocusedYakuName] = useState<string | undefined>(
    undefined,
  );
  const [isOpen, setIsOpen] = useState(false);

  const markedYakuNames = useMemo(
    () =>
      yakuNames.flatMap((name) => {
        const resolved = resolveYakuCheatsheetName(name);
        return resolved === undefined ? [] : [resolved];
      }),
    [yakuNames],
  );

  const canOpenYakuCheatsheet = useCallback(
    (yakuName: string) => resolveYakuCheatsheetName(yakuName) !== undefined,
    [],
  );

  const openAt = useCallback((focused: string | undefined) => {
    setFocusedYakuName(focused);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  return {
    markedYakuNames,
    focusedYakuName,
    isOpen,
    canOpenYakuCheatsheet,
    openAt,
    close,
  };
}
