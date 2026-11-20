"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { revalidateLocalizedPaths } from "@/i18n/revalidate-localized-paths";
import { dailyProblems, db } from "@/lib/db";
import type { ActionResult } from "@/lib/action-types";
import { logExternalError } from "@/lib/log-error";
import { requireAdminActor } from "../../_lib/auth";
import {
  ContentActionKind,
  ContentActionTargetType,
  recordContentAction,
} from "../../_lib/content-action";

const inputSchema = z.object({
  day: z.iso.date(),
  hidden: z.boolean(),
  reason: z.string().trim().min(1).max(500),
});

/**
 * 本日の問題を理由付きで非公開・再公開にする。盤面と解答は保持する。
 * 本日の問題公開設定
 *
 * 日付の行をロックして変更前後を監査ログへ残す。解答保存もこの行を共有
 * ロックするので、非公開の完了後に新しい解答を挿入することはない。
 */
export async function setDailyProblemVisibility(
  input: unknown,
): Promise<
  ActionResult<"unauthorized" | "invalidInput" | "notFound" | "saveFailed">
> {
  const actor = await requireAdminActor("unauthorized");
  if ("error" in actor) return actor;
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { error: "invalidInput" };
  const { day, hidden, reason } = parsed.data;
  try {
    const changed = await db.transaction(async (tx) => {
      const [before] = await tx
        .select()
        .from(dailyProblems)
        .where(eq(dailyProblems.day, day))
        .for("update");
      if (!before) return false;
      const withheldReason = hidden ? reason : null;
      await tx
        .update(dailyProblems)
        .set({ withheldReason })
        .where(eq(dailyProblems.day, day));
      await recordContentAction(tx, {
        ...actor,
        action: ContentActionKind.SetDailyProblemVisibility,
        target: { type: ContentActionTargetType.DailyProblem, key: day },
        metadata: {
          reason,
          before: before.withheldReason,
          after: withheldReason,
        },
      });
      return true;
    });
    if (!changed) return { error: "notFound" };
    revalidateLocalizedPaths(["/daily-problem", "/dashboard"]);
    revalidatePath("/admin/practice-problems");
    return { success: true };
  } catch (error) {
    logExternalError(
      "setDailyProblemVisibility",
      "本日の問題の公開設定を変更できなかった",
      error,
    );
    return { error: "saveFailed" };
  }
}
