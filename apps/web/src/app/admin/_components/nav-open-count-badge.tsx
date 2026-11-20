import { getTranslations } from "next-intl/server";

import { requireAdmin } from "../_lib/auth";

/** これより多い件数は「99+」と出す（サイドバーの幅を件数で動かさない） */
const MAX_SHOWN_COUNT = 99;

/**
 * サイドバーの項目に添える、未対応の件数のバッジ
 * ナビ未対応件数バッジ
 *
 * レイアウトが `<Suspense fallback={null}>` で包んでナビの項目に渡す。0 件なら
 * 何も描かない。
 *
 * @design 件数はこの部品が自分で管理者を確かめてから数える
 * 管理画面のレイアウトは認証をせず、シェル（サイドバー）をすぐに描く（認証は各ページの
 * `requireAdminPage()`）。レイアウトで数えると、管理者でない閲覧者の応答にも件数が
 * 載り、シェルの描画も DB を待つ。ここで確かめて数え、Suspense で後から流し込む。
 * 管理者の確認（`getOptionalVerifiedUser`）は `cache()` 済みで、ページ側の確認と
 * 往復を共有する。
 *
 * 件数はレイアウトを描き直すまで変わらない（画面の遷移だけでは数え直さない）。
 * 閉じる Server Action は `revalidatePath` を呼ぶので、閉じた直後の応答で描き直される。
 * 新しく届いた分は、読み込み直すまで出ない。
 *
 * @param count - 未対応の件数を数える関数
 */
export async function NavOpenCountBadge({
  count,
}: {
  readonly count: () => Promise<number>;
}) {
  const admin = await requireAdmin();
  if ("error" in admin) return undefined;
  const open = await count();
  if (open === 0) return undefined;
  const t = await getTranslations("admin.navigation");
  return (
    <span className="admin-nav-badge">
      <span aria-hidden="true">
        {open > MAX_SHOWN_COUNT ? `${String(MAX_SHOWN_COUNT)}+` : open}
      </span>
      <span className="sr-only">{t("openCount", { count: open })}</span>
    </span>
  );
}
