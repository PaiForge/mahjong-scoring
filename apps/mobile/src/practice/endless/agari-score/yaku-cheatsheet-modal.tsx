import { useTranslations } from "use-intl";

import { YakuCheatsheet } from "../../../reference/yaku-cheatsheet";
import { ReferenceModal } from "./reference-modal";

/**
 * 役一覧参照シート（web の `YakuCheatsheetModal`）
 * 役一覧モーダル
 *
 * 答え合わせから出題ループを離脱せずに「その役がどんな形か」を確かめる
 * ための導線。点数表のシートと対になる。成立していた役には一覧内で印を
 * 付け、役を押して開いたときはその役まで送る。
 */
export function YakuCheatsheetModal({
  isOpen,
  onClose,
  markedYakuNames,
  focusedYakuName,
}: {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  /** この和了で成立している役（一覧内で印を付ける） */
  readonly markedYakuNames: readonly string[];
  /** 開いた直後に開いてスクロールする役（役を押して開いたとき） */
  readonly focusedYakuName?: string;
}) {
  const t = useTranslations("reference.yaku");
  return (
    <ReferenceModal isOpen={isOpen} onClose={onClose} title={t("title")}>
      {/* 開くたびに作り直し、押した役まで送り直す */}
      {isOpen && (
        <YakuCheatsheet
          markedYakuNames={markedYakuNames}
          focusedYakuName={focusedYakuName}
        />
      )}
    </ReferenceModal>
  );
}
