import type { ReactNode } from "react";

/**
 * 設定カードの枠・見出し帯・本体の体裁
 *
 * 読み込み中スケルトン（{@link ./setting-card-skeleton}）が同じ寸法を
 * 再現する必要があるため、クラス文字列をここから引けるようにしておく。
 */
export const SETTING_CARD_FRAME_CLASS =
  "flex flex-col overflow-hidden rounded-xl border-3 border-ink bg-white";
export const SETTING_CARD_HEADER_CLASS =
  "border-b-3 border-ink bg-primary-50 px-4 py-3";
export const SETTING_CARD_BODY_CLASS = "flex flex-col gap-3 p-3";

interface SettingCardProps {
  readonly title: string;
  readonly children: ReactNode;
}

/**
 * 出題設定のカード
 * 設定カード
 *
 * 見出し帯 + 縦並びのチェックボックス群。点数計算・点数表早引きの
 * 設定パネルで共通。
 */
export function SettingCard({ title, children }: SettingCardProps) {
  return (
    <div className={SETTING_CARD_FRAME_CLASS}>
      <div className={SETTING_CARD_HEADER_CLASS}>
        <h3 className="text-center text-sm font-bold text-surface-700">
          {title}
        </h3>
      </div>
      <div className={SETTING_CARD_BODY_CLASS}>{children}</div>
    </div>
  );
}
