"use client";

import { useCallback } from "react";
import type { ReactNode } from "react";
import { resolveYakuCheatsheetName } from "@mahjong-scoring/features/yaku/examples";
import { useYakuCheatsheetState } from "@mahjong-scoring/features/yaku/use-yaku-cheatsheet-state";
import { YakuCheatsheetModal } from "../agari-score/_components/yaku-cheatsheet-modal";

interface YakuCheatsheetModalHandle {
  /**
   * その役を押して役一覧を開けるか
   *
   * 早見表に例示手牌を持たない役（立直・門前清自摸和などの状況役・ドラ）は
   * 開いても見るものが無いため false。呼び出し側はこれで押せる要素にするか
   * ただの文字にするかを分ける
   */
  readonly canOpenYakuCheatsheet: (yakuName: string) => boolean;
  /** 役一覧をその役まで送って開く。開けない役では何もしない */
  readonly openYakuCheatsheet: (yakuName: string) => void;
  /** 開閉状態を持つモーダル本体。呼び出し側のツリーに 1 つ置く */
  readonly yakuCheatsheetModal: ReactNode;
}

/**
 * 答え合わせから役一覧モーダルを開くための状態
 * 役一覧モーダル状態
 *
 * 役判定の対比表・翻数の内訳・点数計算の結果表示のように「役名が並び、
 * 押すとその役の形を確かめられる」画面で共有する。開閉と成立役の目印は
 * features の `useYakuCheatsheetState` が持ち、ここはモーダル本体を組み立てる。
 *
 * @param yakuNames - この手で成立している役名。一覧内で目印を付ける
 */
export function useYakuCheatsheetModal(
  yakuNames: readonly string[],
): YakuCheatsheetModalHandle {
  const {
    markedYakuNames,
    focusedYakuName,
    isOpen,
    canOpenYakuCheatsheet,
    openAt,
    close,
  } = useYakuCheatsheetState(yakuNames);

  const openYakuCheatsheet = useCallback(
    (yakuName: string) => {
      const resolved = resolveYakuCheatsheetName(yakuName);
      if (resolved === undefined) return;
      openAt(resolved);
    },
    [openAt],
  );

  const yakuCheatsheetModal = (
    <YakuCheatsheetModal
      isOpen={isOpen}
      onClose={close}
      markedYakuNames={markedYakuNames}
      focusedYakuName={focusedYakuName}
    />
  );

  return { canOpenYakuCheatsheet, openYakuCheatsheet, yakuCheatsheetModal };
}
