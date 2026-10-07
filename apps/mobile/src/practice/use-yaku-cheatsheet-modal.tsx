import { useCallback, useMemo, useState, type ReactNode } from "react";
import { resolveYakuCheatsheetName } from "@mahjong-scoring/features/yaku/examples";

import { YakuCheatsheetModal } from "./endless/score/yaku-cheatsheet-modal";

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
 * 役判定の対比・翻数の内訳・総合演習の結果表示で共有する。点数計算が返す
 * 役名（「役牌 白」等）から早見表の項目名への解決と、成立役への印の組み立てを
 * ここに寄せ、画面ごとに別の役へ着地しないようにする。
 *
 * @param yakuNames この手で成立している役名。一覧内で印を付ける
 */
export function useYakuCheatsheetModal(
  yakuNames: readonly string[],
): YakuCheatsheetModalHandle {
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

  const openYakuCheatsheet = useCallback((yakuName?: string) => {
    setFocusedYakuName(
      yakuName === undefined ? undefined : resolveYakuCheatsheetName(yakuName),
    );
    setIsOpen(true);
  }, []);

  const yakuCheatsheetModal = (
    <YakuCheatsheetModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      markedYakuNames={markedYakuNames}
      focusedYakuName={focusedYakuName}
    />
  );

  return { canOpenYakuCheatsheet, openYakuCheatsheet, yakuCheatsheetModal };
}
