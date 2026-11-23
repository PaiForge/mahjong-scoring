import { jsonPrivate } from "@/lib/api-response";
import { getOptionalUser } from "@/lib/auth";
import { listPurchases } from "@/lib/billing/purchases";
import {
  viewerPlanOf,
  type ViewerPlanResponse,
} from "@/lib/billing/viewer-plan";
import { listBenefitGrants } from "@/lib/entitlements/benefit-grants";
import { logExternalError } from "@/lib/log-error";

/**
 * 閲覧中のユーザー自身の購入の状態（追加購入を売るか・付与中か）を返すエンドポイント。
 * 料金ページ（静的配信）の購入ボタンの出し分けが使う。
 *
 * 未ログインは `plan: null` を 200 で返す（未認証はエラーではない）。取得失敗は
 * 500 を返す — 「購入なし」で誤魔化すと、払った人に購入ボタンを確定の表示として
 * 出すことになる。呼び出し側は失敗を undefined として受け、購入ボタンへ fail-open
 * する（押した先の Checkout の作成がサーバーで拒む）。
 *
 * @design `/api/profile/me` に載せない
 * プロフィールの応答はヘッダーのために全ページで読まれ、タブを開いたときの値を
 * 持ち続ける。そこへ載せると、(1) 料金ページ以外でも購入履歴を読む、(2) 購入履歴の
 * 読み取りの失敗（`listPurchases` は投げる）がアバター・通知・特典の表示を巻き込む、
 * (3) 料金ページを開いた時点の状態ではなくなる、(4) プロフィール未作成の利用者は
 * 応答が `profile: null` で状態を返せない。昇級試験の開始ボタン（`/api/ranks/me`）と
 * 同じく、使うページだけが叩く専用の口にする。
 *
 * 自分のプラン状態取得API
 */
export async function GET() {
  try {
    const user = await getOptionalUser();
    if (!user) return jsonPrivate<ViewerPlanResponse>({ plan: null });

    const [purchases, grants] = await Promise.all([
      listPurchases(user.id),
      listBenefitGrants(user.id),
    ]);
    return jsonPrivate<ViewerPlanResponse>({
      plan: viewerPlanOf(purchases, grants, new Date()),
    });
  } catch (error) {
    logExternalError("GET /api/plan/me", "プラン状態の取得に失敗", error);
    return jsonPrivate({ error: "unknown" }, { status: 500 });
  }
}
