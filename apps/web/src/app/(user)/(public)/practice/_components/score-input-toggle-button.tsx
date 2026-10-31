"use client";

import { useTranslations } from "next-intl";
import { FOCUS_RING_CLASSES } from "@/app/_components/_lib/link-classes";
import { DropdownIcon } from "@/app/(user)/_components/icons/dropdown-icon";
import { GridIcon } from "@/app/(user)/_components/icons/grid-icon";
import {
  useDisplaySettingsStore,
  useScoreInput,
} from "@/app/_hooks/use-display-settings-store";

interface ScoreInputToggleButtonProps {
  /** 押せなくする（回答フォームの `disabled` をそのまま渡す） */
  readonly disabled?: boolean;
  /** 余白などレイアウト調整用。色・枠は上書きしない */
  readonly className?: string;
  /** ヘルプツアーが照らすときの `data-tour-id` */
  readonly tourId?: string;
}

/**
 * 点数の入力方式（タイル / 選択欄）の切り替えボタン
 * 入力方式切り替えボタン
 *
 * 点数の欄のラベル行の右端に置く小さなアイコンボタン。参考プロジェクト
 * blindfold-chess の `MoveInputPanel` の入力方式の切り替えボタンが前例。
 *
 * - **書く先は表示設定ストアの `scoreInput`**（設定ページのトグルと同じ値。
 *   localStorage に永続化される）。盤面ごとの一時状態は持たない — 持つと
 *   設定ページの値とずれ、ゲスト（設定ページは会員限定）には次回へ残らない。
 *   ここで一度戻せば次の問題も設定ページもその方式になる
 * - **アイコンと `aria-label` / `title` は切り替え先の方式を表す**（今が
 *   タイルなら選択欄のアイコンと「点数を選択欄から選ぶ」）。2 択なので
 *   切り替え先を見せれば「押すと何になるか」が分かる。現在の方式を描くと
 *   「今こうなのか、押すとこうなるのか」が曖昧になる。文字のラベルは添えない
 * - **見た目は無彩色の細枠**。緑は「押して始める面」と「?」、墨は「選択中」の
 *   記号なので使わず、フォーム部品と同じ一段濃い灰の枠にする。ラベル行に
 *   添える補助の操作なので小さく（`size-7`）、`-my-1` でラベル行の高さを
 *   増やさない（「役なし」が小さなリンクなのと同じ格）
 * - **無効化はフォームの `disabled` に追随するだけ**（採点待ち・答え合わせ中・
 *   ヘルプツアーの見本）。チャレンジ・昇級試験の最中でも押せる — 時間を
 *   失うのは本人の選択なので制限しない
 */
export function ScoreInputToggleButton({
  disabled = false,
  className,
  tourId,
}: ScoreInputToggleButtonProps) {
  const t = useTranslations("practice.scoreInput");
  const scoreInput = useScoreInput();
  const setScoreInput = useDisplaySettingsStore((s) => s.setScoreInput);
  const isTiles = scoreInput === "tiles";
  const label = isTiles ? t("switchToSelect") : t("switchToTiles");

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      data-tour-id={tourId}
      onClick={() => setScoreInput(isTiles ? "select" : "tiles")}
      className={`-my-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-surface-300 bg-white text-surface-700 transition-colors hover:bg-surface-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white ${FOCUS_RING_CLASSES}${className ? ` ${className}` : ""}`}
    >
      {isTiles ? (
        <DropdownIcon className="size-4" />
      ) : (
        <GridIcon className="size-4" />
      )}
    </button>
  );
}
