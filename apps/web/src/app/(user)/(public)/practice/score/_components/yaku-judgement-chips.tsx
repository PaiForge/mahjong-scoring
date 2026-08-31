"use client";

import { useTranslations } from "next-intl";
import type {
  YakuSelectionJudgement,
  YakuSelectionState,
} from "@mahjong-scoring/core";
import { resolveYakuCheatsheetName } from "@/app/(user)/(public)/reference/yaku/_lib/yaku-examples";
import { YAKU_SELECTION_CLASSES } from "../../_lib/yaku-selection-classes";

/** 色だけに頼らず正誤が読めるようにチップへ添える記号 */
const CHIP_MARKS: Record<YakuSelectionState, string | undefined> = {
  correct: "✓",
  incorrect: "✗",
  // 選び忘れは記号ではなく「選び忘れ」の語を添える（見落としが本題なので明示する）
  missed: undefined,
};

const CHIP_BASE_CLASSES =
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs";

interface YakuJudgementChipsProps {
  readonly judgements: readonly YakuSelectionJudgement[];
  /** 表示する役が1つも無いときの代替テキスト */
  readonly emptyLabel: string;
  /**
   * 役をタップしたときの通知（役一覧をその役で開く）
   *
   * 渡すのは早見表の項目名。「役牌 白」のような牌まで含んだ役名は
   * 「役牌」に寄せて通知する。早見表に例示手牌を持たない役
   * （立直・門前清自摸和などの状況役）は開いても見るものが無いため、
   * タップ対象にしない。
   */
  readonly onSelect?: (cheatsheetYakuName: string) => void;
}

/**
 * 役の答え合わせチップ列
 * 役別判定チップ
 *
 * 役ごとに正誤を持たせる。1つ余分に選んだだけで回答全体が赤くなると、
 * 合っていた役まで間違いに見えてしまうため、まとめて1つの正誤記号を
 * 付けるのではなくチップ単位で色と記号を持たせている。
 */
export function YakuJudgementChips({
  judgements,
  emptyLabel,
  onSelect,
}: YakuJudgementChipsProps) {
  const t = useTranslations("score.result");

  if (judgements.length === 0) {
    return <span className="text-sm text-surface-400">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {judgements.map((judgement) => {
        const mark = CHIP_MARKS[judgement.state];
        const className = `${CHIP_BASE_CLASSES} ${YAKU_SELECTION_CLASSES[judgement.state]}`;
        const content = (
          <>
            {judgement.name}
            {mark === undefined ? (
              <span className="text-[0.625rem] font-medium">
                {t(`yakuJudgement.${judgement.state}`)}
              </span>
            ) : (
              <>
                <span aria-hidden="true">{mark}</span>
                <span className="sr-only">
                  {t(`yakuJudgement.${judgement.state}`)}
                </span>
              </>
            )}
          </>
        );

        const cheatsheetName = resolveYakuCheatsheetName(judgement.name);

        if (onSelect === undefined || cheatsheetName === undefined) {
          return (
            <span key={judgement.name} className={className}>
              {content}
            </span>
          );
        }

        return (
          <button
            key={judgement.name}
            type="button"
            onClick={() => onSelect(cheatsheetName)}
            // アクセシブル名はチップの文言（役名＋正誤）のままにし、押すと何が
            // 起きるかは title で補う。役名を label で置き換えると正誤が消える。
            title={t("openYakuInList")}
            className={`${className} cursor-pointer hover:underline`}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
