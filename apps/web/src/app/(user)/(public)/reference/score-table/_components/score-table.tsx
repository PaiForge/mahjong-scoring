"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  calculateKoScore,
  calculateOyaScore,
  isInvalidCell,
  type RoleScore,
} from "@mahjong-scoring/core";
import { ToggleGroup } from "@/app/(user)/_components/toggle-group";
import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";
import {
  resolveScoreTableFocus,
  HAN_COLS,
  FU_ROWS,
} from "../_lib/score-table-utils";
import type {
  ScoreTableFocus,
  ScoreTableViewMode,
} from "../_lib/score-table-utils";
import type { Role, WinType } from "@mahjong-scoring/core";
import { NormalScoreTable } from "./normal-score-table";
import { HighScoreTable } from "./high-score-table";
import { KiriageManganNote } from "./kiriage-mangan-note";

interface ScoreTableProps {
  /**
   * 注目させる和了。親子・ロンツモのタブ初期値と表示モードの初期値になり、
   * 該当セル（満貫以上なら区分行）をハイライトして初期表示時に
   * 画面中央へスクロールする。タブを focus と別の組へ切り替えている間、
   * ハイライトは表示しない。
   */
  readonly focus?: ScoreTableFocus;
  /** focus なしでタブ初期値だけ指定する場合の親/子 */
  readonly initialRole?: Role;
  /** focus なしでタブ初期値だけ指定する場合のロン/ツモ */
  readonly initialWinType?: WinType;
  /**
   * セルタップでのぼかし切り替え（暗記用）を有効にするか。
   * 答え合わせの参照用モーダルでは誤タップで数字が消えないよう無効にする。
   */
  readonly blurToggleEnabled?: boolean;
}

/**
 * 点数早見表のコンテナ
 * 点数早見表
 *
 * 親子・ツモロン・表示モードの切り替え状態と点数グリッドの計算を持ち、
 * 表本体の描画は NormalScoreTable / HighScoreTable に委譲する。
 * ページ（クエリパラメータ）からもモーダル（練習の答え合わせ）からも
 * 使えるよう、注目対象は props の focus で受け取る。
 */
export function ScoreTable({
  focus,
  initialRole = "ko",
  initialWinType = "ron",
  blurToggleEnabled = true,
}: ScoreTableProps) {
  const t = useTranslations("scoreTable");
  const highlightRef = useRef<HTMLTableCellElement>(null);

  const focusTarget = useMemo(() => resolveScoreTableFocus(focus), [focus]);

  const [activeTab, setActiveTab] = useState<Role>(focus?.role ?? initialRole);
  const [viewMode, setViewMode] = useState<ScoreTableViewMode>(
    focusTarget.viewMode,
  );
  const [winType, setWinType] = useState<WinType>(
    focus?.winType ?? initialWinType,
  );
  const [hiddenCells, setHiddenCells] = useState<Record<string, boolean>>({});

  const isKo = activeTab === "ko";
  const kiriageMangan = useRuleSettingsStore((s) => s.kiriageMangan);

  // ハイライトは focus と同じ親子・ロンツモの表を見ているときだけ出す
  // （タブを切り替えた表では focus のセルは「その和了の点数」ではないため）
  const isFocusView =
    focus !== undefined &&
    activeTab === focus.role &&
    winType === focus.winType;

  /** 符・翻の点数計算結果グリッド（activeTab / winType / 切り上げ満貫設定に依存） */
  const scoreGrid = useMemo(() => {
    const grid = new Map<string, RoleScore>();
    for (const fu of FU_ROWS) {
      for (const han of HAN_COLS) {
        if (!isInvalidCell(han, fu, winType)) {
          const key = `${han}-${fu}`;
          grid.set(
            key,
            isKo
              ? calculateKoScore(han, fu, { kiriageMangan })
              : calculateOyaScore(han, fu, { kiriageMangan }),
          );
        }
      }
    }
    return grid;
  }, [isKo, winType, kiriageMangan]);

  useEffect(() => {
    if (highlightRef.current) {
      // 点数表は縦にも横にも広いので、縦横ともセルを中央へ寄せる
      // （モーダルやモバイルでは inline を指定しないとセルが画面外に残る）
      highlightRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
  }, []);

  const toggleCell = useCallback((id: string) => {
    setHiddenCells((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const roleOptions = useMemo(
    (): readonly { readonly value: Role; readonly label: string }[] => [
      { value: "ko", label: t("ko") },
      { value: "oya", label: t("oya") },
    ],
    [t],
  );

  const winTypeOptions = useMemo(
    (): readonly { readonly value: WinType; readonly label: string }[] => [
      { value: "ron", label: t("ron") },
      { value: "tsumo", label: t("tsumo") },
    ],
    [t],
  );

  const viewModeOptions = useMemo(
    (): readonly {
      readonly value: ScoreTableViewMode;
      readonly label: string;
    }[] => [
      { value: "normal", label: t("fuHan") },
      { value: "high_score", label: `${t("mangan")}+` },
    ],
    [t],
  );

  return (
    <div className="w-full relative">
      {/* Controls */}
      <div className="sticky top-0 z-20 pb-3 mb-1">
        {/* 狭い画面では間隔も詰めて 1 行に収める。それでも足りなければ
            グループ単位で折り返す（ラベル内では改行させない） */}
        <div className="flex flex-wrap gap-1.5 items-center justify-end sm:gap-2">
          <ToggleGroup
            options={roleOptions}
            selected={activeTab}
            onChange={setActiveTab}
          />
          <ToggleGroup
            options={winTypeOptions}
            selected={winType}
            onChange={setWinType}
          />
          <ToggleGroup
            options={viewModeOptions}
            selected={viewMode}
            onChange={setViewMode}
          />
        </div>
      </div>

      {/* ツモの2段表示（子は上下、親は ALL）の読み方を表の直前で補う */}
      {winType === "tsumo" && (
        <p className="mb-2 text-xs text-surface-500">
          {isKo ? t("tsumoNote.ko") : t("tsumoNote.oya")}
        </p>
      )}

      {/* Table */}
      <div className="overflow-x-auto w-full">
        {viewMode === "normal" ? (
          <NormalScoreTable
            scoreGrid={scoreGrid}
            activeTab={activeTab}
            winType={winType}
            hiddenCells={hiddenCells}
            highlight={isFocusView ? focusTarget.normalCell : undefined}
            highlightRef={highlightRef}
            onToggleCell={blurToggleEnabled ? toggleCell : undefined}
          />
        ) : (
          <HighScoreTable
            activeTab={activeTab}
            winType={winType}
            hiddenCells={hiddenCells}
            highlightKey={isFocusView ? focusTarget.highScoreKey : undefined}
            highlightRef={highlightRef}
            onToggleCell={blurToggleEnabled ? toggleCell : undefined}
          />
        )}
      </div>

      {/* 切り上げ満貫が動かすのは符×翻の表だけなので、満貫+ の表では出さない */}
      {kiriageMangan && viewMode === "normal" && (
        <div className="mt-4">
          <KiriageManganNote />
        </div>
      )}
    </div>
  );
}
