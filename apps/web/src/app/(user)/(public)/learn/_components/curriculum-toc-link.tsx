import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";

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
 */
export async function CurriculumTocLink() {
  const t = await getTranslations("learnCurriculum");

  return (
    <div className="text-right">
      <Link
        href="/learn"
        className={`text-sm font-medium ${TEXT_LINK_CLASSES}`}
      >
        {t("tocLink")}
      </Link>
    </div>
  );
}
