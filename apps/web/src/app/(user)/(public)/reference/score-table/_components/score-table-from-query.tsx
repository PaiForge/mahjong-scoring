"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { isRole, isWinType } from "@mahjong-scoring/core";
import type { Role, WinType } from "@mahjong-scoring/core";
import { parseScoreTableFocusFromParams } from "../_lib/score-table-utils";
import { ScoreTable } from "./score-table";

/**
 * クエリパラメータ駆動の点数早見表
 * クエリ点数早見表
 *
 * リファレンスページ用のラッパー。`?role=ko&winType=ron&han=3&fu=40` を
 * {@link ScoreTable} の focus に変換する。han の無いクエリ（タブ初期値の
 * 指定だけ）も従来どおり効かせる。
 */
export function ScoreTableFromQuery() {
  const searchParams = useSearchParams();

  const paramRole = searchParams.get("role");
  const paramWinType = searchParams.get("winType");
  const paramHan = searchParams.get("han");
  const paramFu = searchParams.get("fu");

  const focus = useMemo(
    () =>
      parseScoreTableFocusFromParams({
        role: paramRole,
        winType: paramWinType,
        han: paramHan,
        fu: paramFu,
      }),
    [paramRole, paramWinType, paramHan, paramFu],
  );

  const initialRole: Role =
    paramRole !== null && isRole(paramRole) ? paramRole : "ko";
  const initialWinType: WinType =
    paramWinType !== null && isWinType(paramWinType) ? paramWinType : "ron";

  return (
    <ScoreTable
      focus={focus}
      initialRole={initialRole}
      initialWinType={initialWinType}
    />
  );
}
