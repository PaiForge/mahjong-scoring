import type { Role, WinType } from "@mahjong-scoring/core";
import { useTranslations } from "use-intl";

import { ScoreTable } from "../../../score-table/score-table";
import { ReferenceModal } from "./reference-modal";

/**
 * 点数表参照モーダル（web の `ScoreTableModal`）
 * 点数表モーダル
 *
 * 答え合わせから出題ループを離脱せずに、正解が点数早見表のどこにあるかを
 * 確かめるための導線。親子・ロンツモのタブはその和了に合わせて開き、探す
 * 手間を省く。暗記用の隠す切り替えは参照中の誤タップを防ぐため無効にする。
 *
 * web は点数そのものを押して開いたとき正解のセル（満貫以上は区分の行）を
 * ハイライトし、表示モードもそれに合わせるが、モバイルの点数早見表は
 * まだ注目するセルを受け取れないため、タブを合わせるだけにとどめる。
 */
export function ScoreTableModal({
  isOpen,
  onClose,
  role,
  winType,
}: {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  /** この和了の親子。タブの初期値に使う */
  readonly role: Role;
  /** この和了のツモ / ロン。タブの初期値に使う */
  readonly winType: WinType;
}) {
  const tScoreTable = useTranslations("scoreTable");

  return (
    <ReferenceModal
      isOpen={isOpen}
      onClose={onClose}
      title={tScoreTable("pageTitle")}
    >
      {/* 開くたびに作り直し、前回切り替えたタブではなくこの和了のタブから始める */}
      {isOpen && (
        <ScoreTable
          initialRole={role}
          initialWinType={winType}
          blurToggleEnabled={false}
        />
      )}
    </ReferenceModal>
  );
}
