"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/app/(user)/_components/button";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { PRACTICE_SCROLL_ANCHOR_ID } from "../../_lib/scroll-anchor";

interface GenerationFailedNoticeProps {
  /** 見出し・案内文・ボタンの文言を引く辞書の namespace */
  readonly translationNamespace: "score" | "tenpaiScore";
  /** 設定画面へ戻る */
  readonly onBackToSetup: () => void;
}

/**
 * 出題条件に合う手牌を作れなかったときの案内（点数の無限訓練で共有）
 * 出題生成失敗
 *
 * リトライを使い切っても出題条件に合う手牌を作れなかったときに盤面の代わりに
 * 出す。スケルトンを出し続けると操作手段が無いまま固まる（終了ボタンも盤面の
 * 一部なので描かれない）ため、条件を変えて戻る導線を明示する。
 */
export function GenerationFailedNotice({
  translationNamespace,
  onBackToSetup,
}: GenerationFailedNoticeProps) {
  const t = useTranslations(translationNamespace);

  return (
    <ContentContainer id={PRACTICE_SCROLL_ANCHOR_ID} fillViewport>
      <PageTitle>{t("title")}</PageTitle>
      <div className="space-y-6 py-8 text-center">
        <p className="text-sm leading-relaxed text-surface-700">
          {t("board.generationFailed")}
        </p>
        <Button variant="secondary" onClick={onBackToSetup}>
          {t("board.backToSetup")}
        </Button>
      </div>
    </ContentContainer>
  );
}
