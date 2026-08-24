"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { HighlightPanel } from "@/app/(user)/_components/highlight-panel";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import {
  PREFERENCE_ANCHORS,
  preferencesHref,
} from "@/app/(user)/(public)/preferences/_lib/anchors";

/**
 * 切り上げ満貫適用中の但し書き
 * 切り上げ満貫の注記
 *
 * 表の 30符4翻・60符3翻は設定次第で満貫になる。表だけを見てもどちらのルールで
 * 出ているか分からず「点数表が間違っている」と読めてしまうため、有効なときは
 * 表の下に明示して設定ページの該当項目へ戻す。
 *
 * ランキング非表示の案内と同じく「自分の設定についての知らせ」なので
 * `HighlightPanel` に入れて表から浮かせる。出すかどうかと周りとの余白は
 * 設定値と置き場所を知っている呼び出し側に任せる。
 */
export function KiriageManganNote() {
  const t = useTranslations("scoreTable");

  return (
    <HighlightPanel>
      <div className="text-center text-sm leading-relaxed text-surface-700">
        <p>{t("kiriageManganActive")}</p>
        <Link
          href={preferencesHref(PREFERENCE_ANCHORS.kiriageMangan)}
          className={`mt-1 inline-block text-xs font-semibold ${TEXT_LINK_CLASSES}`}
        >
          {t("kiriageManganActiveLink")}
        </Link>
      </div>
    </HighlightPanel>
  );
}
