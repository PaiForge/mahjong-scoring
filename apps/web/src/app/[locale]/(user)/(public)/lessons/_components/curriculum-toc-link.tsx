import { getTranslations } from "next-intl/server";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import {
  JapaneseOnlyMark,
  LocaleNavLink,
} from "@/app/[locale]/(user)/_components/locale-nav-link";
import { currentLocale } from "@/i18n/current-locale";
import type { CurriculumChapterSlug } from "@mahjong-scoring/features/curriculum/registry";

import { chapterTocHref } from "../_lib/toc-anchor";
import { LESSONS_PATH } from "@mahjong-scoring/features/routes";

/**
 * 教本の目次への導線
 * 目次リンク
 *
 * Server Component。教本の章を抜粋して見せたセクション（ダッシュボードの
 * 「教本の続き」・練習と道場の「前提となる教本の章」）の末尾に、右端揃えで
 * 置く。抜粋を見た人が「全部でどれだけあるのか」へ 1 クリックで抜けられる
 * ようにするためのもので、抜粋そのものより弱い扱いにしたいのでボタンでは
 * なくテキストリンクにする。
 *
 * ラベルは「目次へ」だけで何の目次かを言わない。3 つの呼び出し元はいずれも
 * 直前に章の並びと見出し（「教本の続き」「前提となる教本の章」）を出して
 * いるため、リンク自身が主語を繰り返す必要がない。
 *
 * 行き先は今のページの言語の目次（英語の練習の説明・級の詳細からは
 * `/en/lessons`）。素の `/lessons` へクライアント遷移すると、英語の文書のまま
 * 日本語の目次が載る（`<html lang>` と辞書は文書の読み込み時に決まるため。
 * `LocaleNavLink` の TSDoc）。言語は props で受けず `currentLocale()` で取る —
 * 呼び出し元（練習の説明・級の詳細・ダッシュボード）はページの
 * `prepareRouteLocale` の後に描かれる。目次がその言語で未公開なら日本語の
 * 目次へ文書ごと移り、「日本語のみ」の印を添える。日本語のページの href は
 * `/lessons`（`#chapter-<slug>` 付きを含む）のまま変えない。
 */
interface CurriculumTocLinkProps {
  /**
   * 目次のこの章の位置へ着地させる（`/lessons#chapter-<slug>`）。抜粋が 1 章を
   * 指しているときに、目次のどこにその章があるかを見せるため
   */
  readonly focusSlug?: CurriculumChapterSlug;
  /**
   * 寄せる側。既定は右端。練習一覧のように、抜粋の後ろへ続けて別の節が
   * 並ぶ場所では中央に置く（節の終わりの導線として読ませる）
   */
  readonly align?: "end" | "center";
}

export async function CurriculumTocLink({
  focusSlug,
  align = "end",
}: CurriculumTocLinkProps = {}) {
  const t = await getTranslations("learnCurriculum");
  const locale = await currentLocale();
  const target = resolveNavTargetFor(
    focusSlug ? chapterTocHref(focusSlug) : LESSONS_PATH,
    locale,
  );
  const tNav = target.crossLocale ? await getTranslations("nav") : undefined;

  return (
    <div className={align === "center" ? "text-center" : "text-right"}>
      <LocaleNavLink
        navTarget={target}
        linkKind="plain"
        className={`text-sm font-medium ${TEXT_LINK_CLASSES}`}
      >
        {t("tocLink")}
        {tNav && <JapaneseOnlyMark label={tNav("language.japaneseOnly")} />}
      </LocaleNavLink>
    </div>
  );
}
