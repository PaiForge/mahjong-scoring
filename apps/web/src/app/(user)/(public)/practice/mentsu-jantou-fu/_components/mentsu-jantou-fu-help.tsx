"use client";

import { useTranslations } from "next-intl";
import { PracticeHelpButton } from "../../_components/practice-help-button";

/** ヘルプ本文の節（辞書キーの接頭辞） */
const SECTIONS = ["ronKoutsu", "jantou", "shuntsu", "scope"] as const;

/**
 * 面子と雀頭の符計算のヘルプ
 * 面子・雀頭符ヘルプ
 *
 * 盤面を見ても読み取れない「何を符に数え、何を数えないか」を置く。
 * とくに次の3つは、正しく数えたつもりで外しやすい:
 *
 * - 刻子の符は和了方法で変わる（ロンで完成した刻子は明刻）
 * - 雀頭・順子の符は待ちの形と関係ない（単騎・嵌張・辺張の2符は待ちに付く符）
 * - 副底・ツモ符・待ちの符はこの練習の対象外
 */
export function MentsuJantouFuHelp() {
  const t = useTranslations("mentsuJantouFu.help");

  return (
    <PracticeHelpButton title={t("title")} label={t("label")}>
      <div className="space-y-4">
        {SECTIONS.map((section) => (
          <section key={section}>
            <h4 className="font-bold text-surface-900">
              {t(`${section}.title`)}
            </h4>
            <p className="mt-1">{t(`${section}.body`)}</p>
          </section>
        ))}
      </div>
    </PracticeHelpButton>
  );
}
