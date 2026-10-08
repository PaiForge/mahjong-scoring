import { useCallback, type ReactNode } from "react";
import { resolveYakuCheatsheetName } from "@mahjong-scoring/features/yaku/examples";
import { useYakuCheatsheetState } from "@mahjong-scoring/features/yaku/use-yaku-cheatsheet-state";

import { YakuCheatsheetModal } from "./endless/agari-score/yaku-cheatsheet-modal";

interface YakuCheatsheetModalHandle {
  /**
   * その役を押して役一覧を開けるか。早見表に例示手牌を持たない役（立直・
   * 門前清自摸和などの状況役・ドラ）は開いても見るものが無いため false
   */
  readonly canOpenYakuCheatsheet: (yakuName: string) => boolean;
  /** 役一覧をその役まで送って開く。役を渡さなければ一覧の先頭から開く */
  readonly openYakuCheatsheet: (yakuName?: string) => void;
  /** 開閉状態を持つシート本体。呼び出し側のツリーに 1 つ置く */
  readonly yakuCheatsheetModal: ReactNode;
}

/**
 * 答え合わせから役一覧のシートを開くための状態（web の `useYakuCheatsheetModal`）
 * 役一覧モーダル状態
 *
 * 開閉と成立役の印は features の `useYakuCheatsheetState` が持ち、ここは
 * シート本体を組み立てる。
 *
 * @param yakuNames この手で成立している役名。一覧内で印を付ける
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
    (yakuName?: string) =>
      openAt(
        yakuName === undefined
          ? undefined
          : resolveYakuCheatsheetName(yakuName),
      ),
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
