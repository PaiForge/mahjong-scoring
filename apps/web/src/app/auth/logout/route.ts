import { NextResponse } from "next/server";

import { logCurrentUserEvent } from "../../../lib/activity-log";
import { createClient } from "../../../lib/supabase/server";

/**
 * ログアウト Route Handler。
 * アクティビティログ記録後にサインアウトする。
 * ログアウトAPI
 */
export async function POST() {
  const supabase = await createClient();

  await logCurrentUserEvent(supabase, "logout");

  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
