"use client";

import { useTranslations } from "next-intl";
import { YakuCheatsheet } from "@/app/(user)/(public)/reference/yaku/_components/yaku-cheatsheet";
import { ReferenceModal } from "./reference-modal";

interface YakuCheatsheetModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  /** この和了で成立している役（一覧内で目印を付ける） */
  readonly markedYakuNames: readonly string[];
  /** 開いた直後に展開してスクロールする役（役をタップして開いたとき） */
  readonly focusedYakuName?: string;
}

/**
 * 役一覧参照モーダル
 * 役一覧モーダル
 *
 * 答え合わせから出題ループを離脱せずに「その役がどんな形か」を確かめる
 * ための導線。点数表モーダルと対になる。成立していた役には一覧内で目印を
 * 付け、役をタップして開いたときはその役まで送る。
 */
export function YakuCheatsheetModal({
  isOpen,
  onClose,
  markedYakuNames,
  focusedYakuName,
}: YakuCheatsheetModalProps) {
  const tYaku = useTranslations("reference.yaku");

  return (
    <ReferenceModal isOpen={isOpen} onClose={onClose} title={tYaku("title")}>
      <YakuCheatsheet
        markedYakuNames={markedYakuNames}
        focusedYakuName={focusedYakuName}
      />
    </ReferenceModal>
  );
}
