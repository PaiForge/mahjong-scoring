"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { isRole, isWinType } from "@mahjong-scoring/core";
import type { Role, WinType } from "@mahjong-scoring/core";
import {
  parseScoreTableFocusFromParams,
  type ScoreTableFocus,
} from "../_lib/score-table-utils";
import { ScoreTable } from "./score-table";

/** URL のクエリから読み取った、表の注目対象とタブ初期値 */
interface ScoreTableQuery {
  readonly focus: ScoreTableFocus | undefined;
  readonly initialRole: Role;
  readonly initialWinType: WinType;
}

interface ScoreTableQueryReaderProps {
  readonly onRead: (query: ScoreTableQuery) => void;
}

/**
 * クエリパラメータを読んで親に渡すだけの葉
 * クエリ読み取り
 *
 * `useSearchParams()` を使うコンポーネントは、静的生成のページでは最も近い
 * Suspense 境界までクライアント描画に切り替わる。表本体でこれを呼ぶと表ごと
 * 初期 HTML から消えるので、何も描画しない葉に閉じ込め、読み取った値だけを
 * コールバックで親へ戻す。
 */
function ScoreTableQueryReader({ onRead }: ScoreTableQueryReaderProps) {
  const searchParams = useSearchParams();

  const paramRole = searchParams.get("role");
  const paramWinType = searchParams.get("winType");
  const paramHan = searchParams.get("han");
  const paramFu = searchParams.get("fu");

  useEffect(() => {
    onRead({
      focus: parseScoreTableFocusFromParams({
        role: paramRole,
        winType: paramWinType,
        han: paramHan,
        fu: paramFu,
      }),
      initialRole: paramRole !== null && isRole(paramRole) ? paramRole : "ko",
      initialWinType:
        paramWinType !== null && isWinType(paramWinType) ? paramWinType : "ron",
    });
  }, [paramRole, paramWinType, paramHan, paramFu, onRead]);

  return null;
}

/**
 * クエリパラメータ駆動の点数早見表
 * クエリ点数早見表
 *
 * リファレンスページ用のラッパー。`?role=ko&winType=ron&han=3&fu=40` を
 * {@link ScoreTable} の focus に変換する。han の無いクエリ（タブ初期値の
 * 指定だけ）も従来どおり効かせる。
 *
 * @design 表は先に描き、クエリは後から効かせる
 * ページは静的生成で、URL のクエリは hydration 後にしか読めない。表本体は
 * 既定（子・ロン・符×翻）でサーバー描画して初期 HTML に数字を載せ、クエリが
 * 読めた時点で {@link ScoreTable} が focus に合わせてタブとハイライトを
 * 切り替える。以前は表ごと `useSearchParams()` の Suspense に入れていたため、
 * 初期 HTML にはスケルトンしか無かった。
 */
export function ScoreTableFromQuery() {
  const [query, setQuery] = useState<ScoreTableQuery | undefined>(undefined);

  return (
    <>
      <Suspense fallback={null}>
        <ScoreTableQueryReader onRead={setQuery} />
      </Suspense>
      <ScoreTable
        focus={query?.focus}
        initialRole={query?.initialRole ?? "ko"}
        initialWinType={query?.initialWinType ?? "ron"}
      />
    </>
  );
}
