import Link from "next/link";
import { useTranslations } from "next-intl";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import {
  PREFERENCE_ANCHORS,
  preferencesHref,
} from "@mahjong-scoring/features/settings/preference-anchors";

interface KiriageManganNoteProps {
  /** 表が切り上げ満貫ありで描かれているか */
  readonly enabled: boolean;
}

/**
 * 切り上げ満貫の設定の脚注
 * 切り上げ満貫の注記
 *
 * 表の 30符4翻・60符3翻は設定次第で満貫になる。表だけを見てもどちらのルールで
 * 出ているか分からず、普段と違うルールで打つ人には「点数表が間違っている」と
 * 読めてしまうため、オン・オフどちらでも表の下に今の設定を出して設定ページの
 * 該当項目へ戻す。
 *
 * 警告ではなく表の読み方の補足なので、表の上のツモの注記と同じ淡い小さな文字に
 * する（以前は有効なときだけ `HighlightPanel` で浮かせていたが、常に出すと
 * 毎回目に付く囲みになるため脚注に改めた）。出すかどうかと周りとの余白は
 * 置き場所を知っている呼び出し側に任せる。
 */
export function KiriageManganNote({ enabled }: KiriageManganNoteProps) {
  const t = useTranslations("scoreTable");

  return (
    <p className="text-xs text-surface-500">
      {t("kiriageManganStatus", { state: enabled ? "on" : "off" })}
      <span aria-hidden="true" className="mx-1.5">
        ・
      </span>
      <Link
        href={preferencesHref(PREFERENCE_ANCHORS.kiriageMangan)}
        className={TEXT_LINK_CLASSES}
      >
        {t("kiriageManganStatusLink")}
      </Link>
    </p>
  );
}
