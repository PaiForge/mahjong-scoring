"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import type { PracticeProblemArchiveRequest } from "@mahjong-scoring/core";
import type {
  ProblemReportContext,
  ProblemReportStage,
} from "@mahjong-scoring/features/problem-reports/problem-report";
import { FlagIcon } from "@/app/[locale]/(user)/_components/icons/flag-icon";
import { FOCUS_RING_CLASSES } from "@/app/_components/_lib/link-classes";
import { isSessionRoute } from "@/app/_components/_lib/session-routes";
import { useAuth } from "@/app/_contexts/auth-context";
import { useIsClient } from "@/app/_hooks/use-is-client";
import { stripLocalePrefix } from "@/i18n/public-path";

import { ProblemReportDialog } from "./problem-report-dialog";

/**
 * 画面下端からの位置。タブバーのある画面は `globals.css` の
 * `--floating-action-bottom-offset`（モバイルはタブバーの上）、タブバーを畳む
 * 出題中の画面（`isSessionRoute`）は画面端の余白だけ持ち上げる。
 */
const BOTTOM_WITH_TAB_BAR = "bottom-(--floating-action-bottom-offset)";
const BOTTOM_WITHOUT_TAB_BAR =
  "bottom-[calc(env(safe-area-inset-bottom)+1rem)] md:bottom-6";

interface ProblemReportButtonProps {
  /**
   * 出している問題の保存要求。報告を送るときに 1 回だけ呼ぶ
   * （盤面の描画ごとに直列化しないため関数で受け取る）
   */
  readonly problem: () => PracticeProblemArchiveRequest;
  /** 報告を出す画面 */
  readonly context: ProblemReportContext;
  /** 正解をどこまで見せたか。選べる理由がこれで決まる */
  readonly stage: ProblemReportStage;
}

/**
 * 出題した問題の誤りを報告する入口（画面右下に浮く丸いボタン）
 * 問題報告ボタン
 *
 * 和了形・聴牌形の点数計算と本日の問題の盤面に、問題が画面にあるときだけ置く。
 * 押すと報告のダイアログ（`ProblemReportDialog`）を開く。ヘルプツアーの対象には
 * しない（盤面の操作ではないため）。
 *
 * @design 報告できるのはログイン済みの利用者だけ。未ログインにはボタンを出さない
 * 匿名の書き込み口を作らないのがスパム対策の中心。認証の読み込み中と未ログインでは
 * 何も描かない（押してからログインを求める形にしない）。BAN 中・退会処理中は
 * Server Action 側の認証のゲートが弾く。匿名の出題は問題の保存（`practice_problems`）
 * にも残していない。匿名も受け付ける案は、CAPTCHA 等の新しい仕組みが要るので採らない。
 *
 * @design 入口は画面右下に固定した直径 44px の丸いボタン
 * 白地・細線・柔らかい影・旗の線画アイコン。画面の上に浮く層なので影を持つ
 * （地に置かれた面は影を持たない規則の例外と同じ扱い）。色は緑にしない — 緑は
 * 「押して始める面」の記号で、報告は盤面の主操作ではない。hover は色だけを変える。
 * 位置は CSS 変数（`--floating-action-bottom-offset`）で持ち、トーストの
 * `--toast-bottom-offset` と同じくモバイルではタブバーの上に置く。重なりの順は
 * タブバー（z-40）とモーダル（z-50）より下の z-30。盤面の最下部の操作に重ならない
 * よう、各盤面がモバイル幅でボタンの高さぶんの余白を下に持つ。
 *
 * `document.body` へポータルする。盤面の中に置いたままだと、祖先に `transform`
 * 等が現れたときに `fixed` の基準がその祖先へ移り、親の `space-y-*` の余白も乗る
 * （`ModalShell` と同じ理由）。
 */
export function ProblemReportButton({
  problem,
  context,
  stage,
}: ProblemReportButtonProps) {
  const t = useTranslations("problemReport");
  const { user, isLoading } = useAuth();
  const isClient = useIsClient();
  const pathname = stripLocalePrefix(usePathname());
  const [isOpen, setIsOpen] = useState(false);

  if (!isClient || isLoading || !user) return undefined;

  const bottom = isSessionRoute(pathname)
    ? BOTTOM_WITHOUT_TAB_BAR
    : BOTTOM_WITH_TAB_BAR;

  return createPortal(
    <>
      <button
        type="button"
        aria-label={t("button")}
        aria-haspopup="dialog"
        onClick={() => setIsOpen(true)}
        className={`fixed right-4 z-30 flex size-11 items-center justify-center rounded-full border border-panel bg-card text-surface-600 shadow-md transition-colors hover:bg-surface-50 hover:text-surface-900 md:right-6 ${bottom} ${FOCUS_RING_CLASSES}`}
      >
        <FlagIcon />
      </button>
      <ProblemReportDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        problem={problem}
        context={context}
        stage={stage}
      />
    </>,
    document.body,
  );
}
