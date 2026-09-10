"use client";

import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { resolveYakuCheatsheetName } from "@/app/(user)/(public)/reference/yaku/_lib/yaku-examples";
import { YakuCheatsheetModal } from "../score/_components/yaku-cheatsheet-modal";

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
 * 押すとその役の形を確かめられる」画面で共有する。点数計算が返す役名
 * （「役牌 白」等）から早見表の項目名への解決と、成立役への目印
 * （`markedYakuNames`）の組み立てをここに寄せ、画面ごとに別の役へ着地
 * しないようにする。
 *
 * @param yakuNames - この手で成立している役名。一覧内で目印を付ける
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

  const openYakuCheatsheet = useCallback((yakuName: string) => {
    const resolved = resolveYakuCheatsheetName(yakuName);
    if (resolved === undefined) return;
    setFocusedYakuName(resolved);
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
